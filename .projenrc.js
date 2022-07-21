const { awscdk } = require('projen');

const PROJECT_NAME = 'cdk-nat-asg-provider';

const COMMON_IGNORE = ['cdk.out', 'cdk.context.json'];

const project = new awscdk.AwsCdkConstructLibrary({
  name: PROJECT_NAME,
  authorName: 'Alfonso Castellanos',
  authorEmail: 'dev@alfonsocastellanos.com',
  description: 'An AWS CDK library providing NAT instances that are each placed in their own auto scaling group to improve fault tolerance and availability.',
  cdkVersion: '2.26.0',
  defaultReleaseBranch: 'main',
  repositoryUrl: 'https://github.com/fonzcastellanos/cdk-nat-asg-provider.git',
  keywords: [
    'aws',
    'awscdk',
    'aws-cdk',
    'nat',
    'asg',
    'network address translation',
    'auto scaling group',
    'ec2',
    'nat provider',
    'nat instance',
    'NatProvider',
    'NatInstanceProvider',
    'NatAsgInstanceProvider',
    'NatAsgProvider',
  ],
  python: {
    distName: PROJECT_NAME,
    module: PROJECT_NAME.split('-').join('_'),
  },
  stability: 'experimental',
  gitignore: COMMON_IGNORE,
  npmignore: COMMON_IGNORE,
});

project.synth();