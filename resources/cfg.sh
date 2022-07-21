#!/bin/sh

die () { 
  printf "$1\n" >&2
  exit 1
}

readonly NETWORK_INTERFACE_ID=$1

readonly METADATA_URL_BASE=http://169.254.169.254

IMDS_TOKEN=$(curl --retry 3 -s -f -X PUT -H "X-aws-ec2-metadata-token-ttl-seconds: 900" $METADATA_URL_BASE/latest/api/token)
if [ $? -gt 0 ] || [ -z "$IMDS_TOKEN" ]; then 
  die "Failed to get IMDSv2 token. Instance metadata might have been disabled or this is not an EC2 instance."
fi
readonly IMDS_TOKEN

get_metadata () {
  curl --retry 3 -s -f -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" $METADATA_URL_BASE/latest/meta-data/$1
}

INSTANCE_ID=$(get_metadata instance-id)
if [ $? -gt 0 ] || [ -z "$INSTANCE_ID" ]; then 
  die "Failed to get instance ID."
fi
readonly INSTANCE_ID

REGION=$(get_metadata placement/region)
if [ $? -gt 0 ] || [ -z "$REGION" ]; then 
  die "Failed to get the region where the instance was launched."
fi
readonly REGION

aws ec2 attach-network-interface \
  --region "$REGION" \
  --instance-id "$INSTANCE_ID" \
  --device-index 1 \
  --network-interface-id "$NETWORK_INTERFACE_ID" ||
  die "Failed to attach network interface."

while ! ip link show dev eth1; do
  sleep 0.5
done

ETH1_MAC=$(cat /sys/class/net/eth1/address) 
if [ $? -gt 0 ] || [ -z "$ETH1_MAC" ]; then
  die "Failed to determine MAC address on eth1."
fi
readonly ETH1_MAC

VPC_CIDR_RANGE=$(get_metadata network/interfaces/macs/$ETH1_MAC/vpc-ipv4-cidr-block)
if [ $? -gt 0 ] || [ -z "$VPC_CIDR_RANGE" ]; then 
  VPC_CIDR_RANGE=0.0.0.0/0
fi
readonly VPC_CIDR_RANGE

sysctl -q -w net.ipv4.ip_forward=1 net.ipv4.conf.eth1.send_redirects=0 && (
  iptables -t nat -C POSTROUTING -o eth1 -s "$VPC_CIDR_RANGE" -j MASQUERADE 2> /dev/null ||
  iptables -t nat -A POSTROUTING -o eth1 -s "$VPC_CIDR_RANGE" -j MASQUERADE 
) || die "Failed to configure the instance as NAT."

yum install -y iptables-services ||
  die "Failed to install iptables service."
service iptables save ||
  die "Failed to save IP table rules."

# prevent eth0 from becoming the default route after a reboot
rm -f /etc/sysconfig/network-scripts/ifcfg-eth0

# eth1 will become the default route
ip route del default dev eth0

while ! ip route show | grep "default via .* dev eth1" ; do 
  sleep 0.5
done 

curl --retry 3 http://www.example.com