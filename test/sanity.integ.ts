import { App, Stack, aws_ec2 as ec2 } from 'aws-cdk-lib';
import { NatAsgProvider } from '../src/index';

const app = new App();

const stack = new Stack(app, "TestStack");

const provider = new NatAsgProvider({});

new ec2.Vpc(stack, "Vpc", {
  cidr: "10.0.0.0/16",
  maxAzs: 2,
  natGatewayProvider: provider,
  subnetConfiguration: [
    {
      name: "Public",
      subnetType: ec2.SubnetType.PUBLIC,
      cidrMask: 24,
    },
    {
      name: "PrivateWithNat",
      subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      cidrMask: 24,
    }
  ]
});

app.synth();