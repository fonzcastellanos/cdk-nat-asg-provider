# API Reference <a name="API Reference" id="api-reference"></a>


## Structs <a name="Structs" id="Structs"></a>

### NatAsgProviderProps <a name="NatAsgProviderProps" id="cdk-nat-asg-provider.NatAsgProviderProps"></a>

Properties to configure `NatAsgProvider`.

#### Initializer <a name="Initializer" id="cdk-nat-asg-provider.NatAsgProviderProps.Initializer"></a>

```typescript
import { NatAsgProviderProps } from 'cdk-nat-asg-provider'

const natAsgProviderProps: NatAsgProviderProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-nat-asg-provider.NatAsgProviderProps.property.instanceType">instanceType</a></code> | <code>aws-cdk-lib.aws_ec2.InstanceType</code> | The EC2 instance type of the NAT instances. |
| <code><a href="#cdk-nat-asg-provider.NatAsgProviderProps.property.keyPair">keyPair</a></code> | <code>string</code> | The name of the SSH key pair granting access to the NAT instances. |
| <code><a href="#cdk-nat-asg-provider.NatAsgProviderProps.property.securityGroup">securityGroup</a></code> | <code>aws-cdk-lib.aws_ec2.ISecurityGroup</code> | The security group associated with the NAT instances. |
| <code><a href="#cdk-nat-asg-provider.NatAsgProviderProps.property.trafficDirection">trafficDirection</a></code> | <code>aws-cdk-lib.aws_ec2.NatTrafficDirection</code> | The allowed traffic directions through the NAT instances. |

---

##### `instanceType`<sup>Optional</sup> <a name="instanceType" id="cdk-nat-asg-provider.NatAsgProviderProps.property.instanceType"></a>

```typescript
public readonly instanceType: InstanceType;
```

- *Type:* aws-cdk-lib.aws_ec2.InstanceType
- *Default:* t2.micro

The EC2 instance type of the NAT instances.

> [https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.InstanceType.html](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.InstanceType.html)

---

##### `keyPair`<sup>Optional</sup> <a name="keyPair" id="cdk-nat-asg-provider.NatAsgProviderProps.property.keyPair"></a>

```typescript
public readonly keyPair: string;
```

- *Type:* string

The name of the SSH key pair granting access to the NAT instances.

> [https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html)

---

##### `securityGroup`<sup>Optional</sup> <a name="securityGroup" id="cdk-nat-asg-provider.NatAsgProviderProps.property.securityGroup"></a>

```typescript
public readonly securityGroup: ISecurityGroup;
```

- *Type:* aws-cdk-lib.aws_ec2.ISecurityGroup
- *Default:* A security group will be created.

The security group associated with the NAT instances.

> [https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.ISecurityGroup.html](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.ISecurityGroup.html)

---

##### `trafficDirection`<sup>Optional</sup> <a name="trafficDirection" id="cdk-nat-asg-provider.NatAsgProviderProps.property.trafficDirection"></a>

```typescript
public readonly trafficDirection: NatTrafficDirection;
```

- *Type:* aws-cdk-lib.aws_ec2.NatTrafficDirection
- *Default:* `aws-cdk-lib.aws_ec2.NatTrafficDirection.INBOUND_AND_OUTBOUND`

The allowed traffic directions through the NAT instances.

If you set this to a value other than
`ec2.NatTrafficDirection.INBOUND_AND_OUTBOUND`, you must
configure the security group for the NAT instances either by providing
a fully configured security group through the `securityGroup` property
or by using the `NatAsgProvider` object's `securityGroup` or
`connections` properties after passing the `NatAsgProvider` object to a
`Vpc` object.

> [https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.NatTrafficDirection.html](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.NatTrafficDirection.html)

---

## Classes <a name="Classes" id="Classes"></a>

### NatAsgProvider <a name="NatAsgProvider" id="cdk-nat-asg-provider.NatAsgProvider"></a>

- *Implements:* aws-cdk-lib.aws_ec2.IConnectable

`NatAsgProvider` is a NAT provider that places each NAT instance in its own auto scaling group to improve fault tolerance and availability.

`NatAsgProvider` extends `NatProvider`:

> [https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.NatProvider.html](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.NatProvider.html)

#### Initializers <a name="Initializers" id="cdk-nat-asg-provider.NatAsgProvider.Initializer"></a>

```typescript
import { NatAsgProvider } from 'cdk-nat-asg-provider'

new NatAsgProvider(props: NatAsgProviderProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-nat-asg-provider.NatAsgProvider.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-nat-asg-provider.NatAsgProviderProps">NatAsgProviderProps</a></code> | Configuration properties. |

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-nat-asg-provider.NatAsgProvider.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-nat-asg-provider.NatAsgProviderProps">NatAsgProviderProps</a>

Configuration properties.

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-nat-asg-provider.NatAsgProvider.configureNat">configureNat</a></code> | Called by the VPC to configure NAT. |
| <code><a href="#cdk-nat-asg-provider.NatAsgProvider.configureSubnet">configureSubnet</a></code> | Configures subnet with the gateway. |

---

##### `configureNat` <a name="configureNat" id="cdk-nat-asg-provider.NatAsgProvider.configureNat"></a>

```typescript
public configureNat(opts: ConfigureNatOptions): void
```

Called by the VPC to configure NAT.

Don't call this directly, the VPC will call it automatically.

###### `opts`<sup>Required</sup> <a name="opts" id="cdk-nat-asg-provider.NatAsgProvider.configureNat.parameter.opts"></a>

- *Type:* aws-cdk-lib.aws_ec2.ConfigureNatOptions

---

##### `configureSubnet` <a name="configureSubnet" id="cdk-nat-asg-provider.NatAsgProvider.configureSubnet"></a>

```typescript
public configureSubnet(subnet: PrivateSubnet): void
```

Configures subnet with the gateway.

Don't call this directly, the VPC will call it automatically.

###### `subnet`<sup>Required</sup> <a name="subnet" id="cdk-nat-asg-provider.NatAsgProvider.configureSubnet.parameter.subnet"></a>

- *Type:* aws-cdk-lib.aws_ec2.PrivateSubnet

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-nat-asg-provider.NatAsgProvider.gateway">gateway</a></code> | Use NAT Gateways to provide NAT services for your VPC. |
| <code><a href="#cdk-nat-asg-provider.NatAsgProvider.instance">instance</a></code> | Use NAT instances to provide NAT services for your VPC. |

---

##### `gateway` <a name="gateway" id="cdk-nat-asg-provider.NatAsgProvider.gateway"></a>

```typescript
import { NatAsgProvider } from 'cdk-nat-asg-provider'

NatAsgProvider.gateway(props?: NatGatewayProps)
```

Use NAT Gateways to provide NAT services for your VPC.

NAT gateways are managed by AWS.

> [https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)

###### `props`<sup>Optional</sup> <a name="props" id="cdk-nat-asg-provider.NatAsgProvider.gateway.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_ec2.NatGatewayProps

---

##### `instance` <a name="instance" id="cdk-nat-asg-provider.NatAsgProvider.instance"></a>

```typescript
import { NatAsgProvider } from 'cdk-nat-asg-provider'

NatAsgProvider.instance(props: NatInstanceProps)
```

Use NAT instances to provide NAT services for your VPC.

NAT instances are managed by you, but in return allow more configuration.

Be aware that instances created using this provider will not be
automatically replaced if they are stopped for any reason. You should implement
your own NatProvider based on AutoScaling groups if you need that.

> [https://docs.aws.amazon.com/vpc/latest/userguide/VPC_NAT_Instance.html](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_NAT_Instance.html)

###### `props`<sup>Required</sup> <a name="props" id="cdk-nat-asg-provider.NatAsgProvider.instance.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_ec2.NatInstanceProps

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-nat-asg-provider.NatAsgProvider.property.configuredGateways">configuredGateways</a></code> | <code>aws-cdk-lib.aws_ec2.GatewayConfig[]</code> | Return list of gateways spawned by the provider. |
| <code><a href="#cdk-nat-asg-provider.NatAsgProvider.property.connections">connections</a></code> | <code>aws-cdk-lib.aws_ec2.Connections</code> | The network connections associated with the security group of the NAT instances. |
| <code><a href="#cdk-nat-asg-provider.NatAsgProvider.property.securityGroup">securityGroup</a></code> | <code>aws-cdk-lib.aws_ec2.ISecurityGroup</code> | The security group associated with the NAT instances. |

---

##### `configuredGateways`<sup>Required</sup> <a name="configuredGateways" id="cdk-nat-asg-provider.NatAsgProvider.property.configuredGateways"></a>

```typescript
public readonly configuredGateways: GatewayConfig[];
```

- *Type:* aws-cdk-lib.aws_ec2.GatewayConfig[]

Return list of gateways spawned by the provider.

---

##### `connections`<sup>Required</sup> <a name="connections" id="cdk-nat-asg-provider.NatAsgProvider.property.connections"></a>

```typescript
public readonly connections: Connections;
```

- *Type:* aws-cdk-lib.aws_ec2.Connections

The network connections associated with the security group of the NAT instances.

> [https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Connections.html](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Connections.html)

---

##### `securityGroup`<sup>Required</sup> <a name="securityGroup" id="cdk-nat-asg-provider.NatAsgProvider.property.securityGroup"></a>

```typescript
public readonly securityGroup: ISecurityGroup;
```

- *Type:* aws-cdk-lib.aws_ec2.ISecurityGroup

The security group associated with the NAT instances.

> [https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.ISecurityGroup.html](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.ISecurityGroup.html)

---



