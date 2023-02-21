import { App, Stack, aws_ec2 as ec2 } from 'aws-cdk-lib';

import { NatAsgProvider } from './index';

const USAGE = 'Usage: node manual.ts key_pair [max_azs]';

const args = process.argv.slice(2);
if (args.length < 1) {
  process.stderr.write('Insufficient number of arguments were provided.\n');
  process.stderr.write(`${USAGE}\n`);
  process.exit(1);
}

const keyPair = args[0];

let maxAzs: number | undefined;
if (args.length > 1) {
  maxAzs = Number(args[1]);
  if (Number.isNaN(maxAzs)) {
    process.stderr.write('[max_azs] argument could not be converted to a number.\n');
    process.exit(1);
  }
} else {
  maxAzs = 2;
}

const app = new App();
const stack = new Stack(app, 'Stack', {
  env: {
    account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
  },
});

const natProvider = new NatAsgProvider({
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass.T2,
    ec2.InstanceSize.MICRO,
  ),
  trafficDirection: ec2.NatTrafficDirection.NONE,
  keyPair: keyPair,
});

const vpc = new ec2.Vpc(stack, 'Vpc', {
  cidr: '10.0.0.0/16',
  maxAzs: maxAzs,
  natGatewayProvider: natProvider,
  subnetConfiguration: [
    {
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
      cidrMask: 24,
    },
    {
      name: 'PrivateWithNat',
      subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      cidrMask: 24,
    },
  ],
});

const { subnets } = vpc.selectSubnets({
  subnetGroupName: 'PrivateWithNat',
});
for (const subnet of subnets) {
  const instance = new ec2.Instance(subnet, 'Instance', {
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T2,
      ec2.InstanceSize.MICRO,
    ),
    machineImage: new ec2.AmazonLinuxImage({
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
      edition: ec2.AmazonLinuxEdition.STANDARD,
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      storage: ec2.AmazonLinuxStorage.GENERAL_PURPOSE,
      virtualization: ec2.AmazonLinuxVirt.HVM,
    }),
    vpc: vpc,
    allowAllOutbound: false,
    keyName: keyPair,
    vpcSubnets: {
      subnets: [subnet],
    },
  });
  instance.connections.allowFrom(natProvider, ec2.Port.tcp(22));
  instance.connections.allowToAnyIpv4(ec2.Port.allIcmp());

  const subnetPeer = ec2.Peer.ipv4(subnet.ipv4CidrBlock);
  natProvider.connections.allowFrom(subnetPeer, ec2.Port.tcp(80));
  natProvider.connections.allowFrom(subnetPeer, ec2.Port.tcp(443));

  natProvider.connections.allowFrom(subnetPeer, ec2.Port.allIcmp());
  natProvider.connections.allowTo(subnetPeer, ec2.Port.tcp(22));
}

natProvider.connections.allowFrom(ec2.Peer.ipv4('0.0.0.0/0'), ec2.Port.tcp(22));
const defaultPeer = ec2.Peer.ipv4('0.0.0.0/0');
natProvider.connections.allowTo(defaultPeer, ec2.Port.tcp(80));
natProvider.connections.allowTo(defaultPeer, ec2.Port.tcp(443));

natProvider.connections.allowToAnyIpv4(ec2.Port.allIcmp());

app.synth();