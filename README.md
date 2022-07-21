# CDK NAT ASG Provider

Use this [AWS Cloud Development Kit (CDK)](https://docs.aws.amazon.com/cdk/v2/guide/home.html) library to configure and deploy [Network Address Translation (NAT) instances](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_NAT_Instance.html) that are each in their own [auto scaling group (ASG)](https://docs.aws.amazon.com/autoscaling/ec2/userguide/auto-scaling-groups.html) to improve fault tolerance and availability.

Works with AWS CDK <strong>v2</strong>.

## Problem

Although the [NAT gateways](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html) offered by AWS have high availability, high bandwidth scalability, and minimal administration needs, they can be too expensive for small scale applications. A cheaper alternative, one that AWS mentions in its documentation but does not recommend, is to configure and manage your own NAT instances. One way of doing this is with the CDK using [`NatInstanceProvider`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.NatInstanceProvider.html).

```typescript
import { aws_ec2 as ec2 } from 'aws-cdk-lib';

// Factory method constructs and configures a `NatInstanceProvider` object
const provider = ec2.NatProvider.instance({
  instanceType: new ec2.InstanceType('t2.micro'),
});

const vpc = new ec2.Vpc(this, 'Vpc', {
  natGatewayProvider: provider,
});
```

A major downside of this approach is that the created NAT instances will not be automatically replaced if they are stopped for whatever reason.

## Solution

To provide better fault tolerance and availability, I implemented a NAT provider called `NatAsgProvider` that places each created NAT instance in its own ASG.

```typescript
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { NatAsgProvider } from 'cdk-nat-asg-provider';

const provider = new NatAsgProvider({});

const vpc = new ec2.Vpc(this, 'Vpc', {
  natGatewayProvider: provider,
});
```

Like `NatInstanceProvider`, `NatAsgProvider` extends [`NatProvider`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.NatProvider.html).

## How it works

The number of NAT instances to create and the placement of those NAT instances is dictated by the configuration of the relevant `VPC` object using the following configuration properties provided to the `VPC` constructor:

- [`natGatewaySubnets`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html#natgatewaysubnets)
  - Selects the subnets that will have NAT instances
  - By default, all public subnets are selected
- [`natGateways`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html#natgateways)
  - The number of NAT instances to create
  - By default, one NAT instance per AZ

At a high-level, this is how `NatAsgProvider` achieves its purpose:
- Enables NAT in the EC2 instances, which are running Amazon Linux 2
- Places each NAT instance in its own ASG, configured by a [launch template](https://docs.aws.amazon.com/autoscaling/ec2/userguide/launch-templates.html)
- Uses [`cfn-signal`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-signal.html) in conjunction with a [`CreationPolicy`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-creationpolicy.html) and [`UpdatePolicy`](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatepolicy.html) to suspend work on the stack until the NAT instance signals successful creation or update, respectively, of its ASG
- Attaches an additional [elastic network interface (ENI)](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-eni.html) to each NAT instance
  - Each of these ENI is assigned an [elastic IP (EIP) address](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html)
  - Sets the default gateway to be the newly attached ENI

## Installation

### Typescript (npm)
```shell
npm install cdk-nat-asg-provider
```
or
```shell
yarn install cdk-nat-asg-provider
```

### Python (PyPI)
```shell
pip install cdk-nat-asg-provider
```

## Usage

For general usage, check out the [API documentation](API.md).

### Example: Manual testing of NAT configuration

I implemented a test environment similar to the one described in the [AWS VPC docs](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_NAT_Instance.html#nat-test-configuration). It allows you to manually check whether instances in private subnets can access the internet through the NAT instances by using the NAT instances as bastion servers. 

The implementation is in [src/manual.integ.ts](src/manual.integ.ts). It's worth taking a look if you're confused about how to configure `Vpc` and `NatAsgProvider`.

To **deploy** the manual integration test, execute the `sh` script `scripts/manual-integ-test` and use the `deploy` command:

```shell
./scripts/manual-integ-test deploy <ACCOUNT> <AWS_REGION> <KEY_PAIR_NAME> [MAX_AZS]
```
`MAX_AZs` is optional.

To **destroy** the manual integration test, execute the same script with same arguments using the `destroy` command:

```shell
./scripts/manual-integ-test destroy <ACCOUNT> <AWS_REGION> <KEY_PAIR_NAME> [MAX_AZS]
```

## Project Configuration via Projen

Projen synthesizes and maintains project configuration. Most of the configuration files, such as `package.json`, `.gitignore`, and those defining Github Actions workflows, are managed by Projen and are read-only. To add, remove, or modify configuration files, edit [`.projenrc.js`](.projenrc.js) and then run `npx projen`. Check out Projen's [documentation website](https://projen.io) or [GitHub repo](https://github.com/projen/projen) for more details.

## Contributing

Feel free to open issues to report bugs or suggest features. Contributions via pull requests are much appreciated.

## License
Released under the [Apache 2.0](LICENSE) license.