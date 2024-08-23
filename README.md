## team-in-a-box
📦

### Building infra


#### Env vars to set
ANTHROPIC_API_KEY
LANGCHAIN_API_KEY
TAVILY_API_KEY
MONGO_DB_URI

#### event-stream lambdas
Processes inbound events from webhooks like slack, post to SQS, load into mongo

```sh
./build.sh
# Use output api_gateway_url in Slack App webhook
```

#### Mongodb setup
- Get free atlas tier
- Set up Ip access list https://www.mongodb.com/docs/atlas/security/ip-access-list/ with lamba's 

#### AWS
- Not free

- Use user policy:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:CreateVpc",
                "ec2:DeleteVpc",
                "ec2:CreateSubnet",
                "ec2:DeleteSubnet",
                "ec2:CreateRouteTable",
                "ec2:DeleteRouteTable",
                "ec2:CreateRoute",
                "ec2:DeleteRoute",
                "ec2:CreateInternetGateway",
                "ec2:DeleteInternetGateway",
                "ec2:AttachInternetGateway",
                "ec2:DetachInternetGateway",
                "ec2:AllocateAddress",
                "ec2:ReleaseAddress",
                "ec2:AssociateRouteTable",
                "ec2:DisassociateRouteTable",
                "ec2:CreateNatGateway",
                "ec2:DeleteNatGateway",
                "ec2:DescribeVpcs",
                "ec2:DescribeSubnets",
                "ec2:DescribeRouteTables",
                "ec2:DescribeInternetGateways",
                "ec2:DescribeAddresses",
                "ec2:DescribeNatGateways",
                "ec2:DescribeNetworkInterfaces",
                "ec2:CreateTags",
                "ec2:DescribeAddressesAttribute",
                "ec2:DescribeVpcAttribute",
                "ec2:ModifyVpcAttribute",
                "ec2:CreateSecurityGroup",
                "ec2:DescribeSecurityGroups",
            ],
            "Resource": "*"
        }
    ]
}
```