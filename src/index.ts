import * as path from 'path';

import {
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_autoscaling as autoscaling,
  aws_s3_assets as s3assets,
  Fn,
  Lazy,
} from 'aws-cdk-lib';

const CFG_SCRIPT_NAME = 'cfg.sh';
const CFG_SCRIPT_PATH = path.join(__dirname, '..', 'resources', CFG_SCRIPT_NAME);

/**
 * Properties to configure `NatAsgProvider`.
 */
export interface NatAsgProviderProps {
  /**
   * The EC2 instance type of the NAT instances.
   *
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.InstanceType.html
   *
   * @defaultValue t2.micro
   */
  readonly instanceType?: ec2.InstanceType;

  /**
   * The allowed traffic directions through the NAT instances.
   *
   * If you set this to a value other than
   * `ec2.NatTrafficDirection.INBOUND_AND_OUTBOUND`, you must
   * configure the security group for the NAT instances either by providing
   * a fully configured security group through the `securityGroup` property
   * or by using the `NatAsgProvider` object's `securityGroup` or
   * `connections` properties after passing the `NatAsgProvider` object to a
   * `Vpc` object.
   *
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.NatTrafficDirection.html
   *
   * @defaultValue `aws-cdk-lib.aws_ec2.NatTrafficDirection.INBOUND_AND_OUTBOUND`
   */
  readonly trafficDirection?: ec2.NatTrafficDirection;

  /**
   * The name of the SSH key pair granting access to the NAT instances.
   *
   * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html
   */
  readonly keyPair?: string;

  /**
   * The security group associated with the NAT instances.
   *
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.ISecurityGroup.html
   *
   * @defaultValue A security group will be created.
   */
  readonly securityGroup?: ec2.ISecurityGroup;
}

/**
 * `NatAsgProvider` is a NAT provider that places each NAT instance in its own
 * auto scaling group to improve fault tolerance and availability.
 *
 * `NatAsgProvider` extends `NatProvider`:
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.NatProvider.html
 */
export class NatAsgProvider extends ec2.NatProvider implements ec2.IConnectable {
  private netIfIds = new PrefSet<string>();

  private conns?: ec2.Connections;
  private sg?: ec2.ISecurityGroup;

  /**
   *
   * @param props Configuration properties.
   */
  constructor(private readonly props: NatAsgProviderProps) {
    super();
  }

  public configureNat(opts: ec2.ConfigureNatOptions) {
    const idPrefix = 'NatAsg';

    const instType = this.props.instanceType ??
      ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO);

    const traffDir = this.props.trafficDirection ??
      ec2.NatTrafficDirection.INBOUND_AND_OUTBOUND;

    this.sg = this.props.securityGroup ??
      new ec2.SecurityGroup(opts.vpc, `${idPrefix}SecurityGroup`, {
        vpc: opts.vpc,
        description: 'Security group for the NAT instances',
        allowAllOutbound: allowAllOutbound(traffDir),
      });

    this.conns = new ec2.Connections({
      securityGroups: [this.sg],
    });

    if (allowAllInbound(traffDir)) {
      this.conns.allowFromAnyIpv4(ec2.Port.allTraffic());
    }

    const cfgScriptAsset = new s3assets.Asset(opts.vpc, `${idPrefix}CfgScript`, {
      path: CFG_SCRIPT_PATH,
    });

    const cfgScriptTargetPath = path.join('/tmp', CFG_SCRIPT_NAME);

    const cfgScriptInitFile = ec2.InitFile.fromExistingAsset(cfgScriptTargetPath, cfgScriptAsset, {
      mode: '000755',
      owner: 'root',
      group: 'root',
    });

    const machImg = new ec2.AmazonLinuxImage({
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
      edition: ec2.AmazonLinuxEdition.STANDARD,
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      storage: ec2.AmazonLinuxStorage.GENERAL_PURPOSE,
      virtualization: ec2.AmazonLinuxVirt.HVM,
    });

    const attachNetIfPolicyStmt = new iam.PolicyStatement({
      resources: ['*'],
      actions: ['ec2:AttachNetworkInterface'],
    });

    for (const subnet of opts.natSubnets) {
      const netIf = new ec2.CfnNetworkInterface(subnet, `${idPrefix}NetworkInterface`, {
        subnetId: subnet.subnetId,
        description: 'Network interface for a NAT instance',
        groupSet: [this.sg.securityGroupId],
        sourceDestCheck: false,
      });

      const eip = new ec2.CfnEIP(subnet, `${idPrefix}Eip`, {
        domain: 'vpc',
      });
      new ec2.CfnEIPAssociation(subnet, `${idPrefix}EipAssoc`, {
        allocationId: eip.attrAllocationId,
        networkInterfaceId: netIf.ref,
      });

      const udata = ec2.UserData.forLinux();
      udata.addCommands('yum install -y aws-cfn-bootstrap');

      const role = new iam.Role(subnet, `${idPrefix}Role`, {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      });
      role.addToPolicy(attachNetIfPolicyStmt);
      const instProf = new iam.CfnInstanceProfile(subnet, `${idPrefix}InstanceProfile`, {
        roles: [role.roleName],
      });

      const launchTmpl = new ec2.CfnLaunchTemplate(subnet, `${idPrefix}LaunchTemplate`, {
        launchTemplateData: {
          creditSpecification: { cpuCredits: 'standard' },
          imageId: machImg.getImage(subnet).imageId,
          instanceType: instType.toString(),
          iamInstanceProfile: { arn: instProf.attrArn },
          keyName: this.props.keyPair,
          networkInterfaces: [{
            deviceIndex: 0,
            associatePublicIpAddress: true,
            deleteOnTermination: true,
            groups: [this.sg.securityGroupId],
          }],
          userData: Lazy.string({
            produce: () => {
              return Fn.base64(udata.render());
            },
          }),
        },
      });

      const asg = new autoscaling.CfnAutoScalingGroup(subnet, `${idPrefix}Asg`, {
        maxSize: '1',
        minSize: '1',
        availabilityZones: [subnet.availabilityZone],
        launchTemplate: {
          version: launchTmpl.attrLatestVersionNumber,
          launchTemplateId: launchTmpl.ref,
        },
        vpcZoneIdentifier: [subnet.subnetId],
      });
      asg.cfnOptions.creationPolicy = {
        resourceSignal: {
          count: 1,
          timeout: 'PT10M',
        },
      };
      asg.cfnOptions.updatePolicy = {
        autoScalingRollingUpdate: {
          pauseTime: 'PT10M',
          suspendProcesses: [
            'HealthCheck',
            'ReplaceUnhealthy',
            'AZRebalance',
            'AlarmNotification',
            'ScheduledActions',
          ],
          waitOnResourceSignals: true,
        },
      };

      const cfnInit = ec2.CloudFormationInit.fromElements(
        cfgScriptInitFile,
        ec2.InitCommand.argvCommand([`${cfgScriptTargetPath}`, netIf.ref]),
      );
      cfnInit.attach(launchTmpl, {
        instanceRole: role,
        platform: ec2.OperatingSystemType.LINUX,
        userData: udata,
        signalResource: asg,
      });

      this.netIfIds.add(subnet.availabilityZone, netIf.ref);
    }

    for (const s of opts.privateSubnets) {
      this.configureSubnet(s);
    }
  }

  public configureSubnet(subnet: ec2.PrivateSubnet) {
    subnet.addRoute('DefaultRoute', {
      routerType: ec2.RouterType.NETWORK_INTERFACE,
      routerId: this.netIfIds.pick(subnet.availabilityZone),
      enablesInternetConnectivity: true,
    });
  }

  public get configuredGateways(): ec2.GatewayConfig[] {
    return this.netIfIds.values().map(x => ({ az: x[0], gatewayId: x[1] }));
  }

  /**
   * The network connections associated with the security group of the NAT instances.
   *
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Connections.html
   */
  public get connections(): ec2.Connections {
    if (this.conns === undefined) {
      throw new Error("Pass the NatAsgProvider to a VPC before accessing \'connections\'");
    }
    return this.conns;
  }

  /**
   * The security group associated with the NAT instances.
   *
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.ISecurityGroup.html
   */
  public get securityGroup(): ec2.ISecurityGroup {
    if (this.sg === undefined) {
      throw new Error("Pass the NatAsgProvider to a VPC before accessing \'securityGroup\'");
    }
    return this.sg;
  }
}

function allowAllOutbound(d: ec2.NatTrafficDirection): boolean {
  return d === ec2.NatTrafficDirection.INBOUND_AND_OUTBOUND ||
    d === ec2.NatTrafficDirection.OUTBOUND_ONLY;
}

function allowAllInbound(d: ec2.NatTrafficDirection): boolean {
  return d === ec2.NatTrafficDirection.INBOUND_AND_OUTBOUND;
}

/**
 * PrefSet is a set of values where each value may be associated with a
 * preference key. A value may be retrieved by providing a preference
 * key. If there's no value associated with the preference key, then a
 * value is selected in a round-robin fashion.
 */
class PrefSet<A> {
  private readonly prefVals: Record<string, A> = {};
  private readonly vals = new Array<[string, A]>();
  private next = 0;

  public add(pref: string, val: A) {
    this.prefVals[pref] = val;
    this.vals.push([pref, val]);
  }

  public pick(pref: string): A {
    if (this.vals.length === 0) {
      throw new Error('Picking an empty set');
    }

    if (pref in this.prefVals) {
      return this.prefVals[pref];
    }

    this.next = this.next % this.vals.length;
    const picked = this.vals[this.next][1];
    this.next++;

    return picked;
  }

  public values(): Array<[string, A]> {
    return this.vals;
  }
}