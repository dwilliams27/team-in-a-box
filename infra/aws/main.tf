variable "MONGO_DB_URI" {
  description = "MongoDB connection URI"
  type        = string
}

# Configure the AWS provider
provider "aws" {
  region = "us-east-1"
}

# Create an SQS queue
resource "aws_sqs_queue" "event_stream_queue" {
  name = "event-stream-queue"
}

# Create an IAM role for the Lambda function
resource "aws_iam_role" "lambda_role" {
  name = "event-stream-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_vpc_policy" {
  name = "lambda_vpc_policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# Attach necessary policies to the IAM role
resource "aws_iam_role_policy_attachment" "lambda_sqs_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_iam_role_policy" "lambda_sqs_policy" {
  name = "lambda-sqs-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.event_stream_queue.arn
      }
    ]
  })
}

# Lambda event source mapping
resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.event_stream_queue.arn
  function_name    = aws_lambda_function.event_stream_processor_lambda.function_name
  batch_size       = 1
}

# Create an API Gateway
resource "aws_apigatewayv2_api" "event_stream_api" {
  name          = "event-stream-api"
  protocol_type = "HTTP"
}

# Create an API Gateway stage
resource "aws_apigatewayv2_stage" "event_stream_stage" {
  api_id      = aws_apigatewayv2_api.event_stream_api.id
  name        = "$default"
  auto_deploy = true
}

# Create an API Gateway integration
resource "aws_apigatewayv2_integration" "event_stream_integration" {
  api_id             = aws_apigatewayv2_api.event_stream_api.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.event_stream_lambda.invoke_arn
}

# Create an API Gateway route
resource "aws_apigatewayv2_route" "event_stream_route" {
  api_id    = aws_apigatewayv2_api.event_stream_api.id
  route_key = "POST /event-stream"
  target    = "integrations/${aws_apigatewayv2_integration.event_stream_integration.id}"
}

# Allow API Gateway to invoke the Lambda function
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_stream_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.event_stream_api.execution_arn}/*/*"
}

# Output the API Gateway URL
output "api_gateway_url" {
  value = "${aws_apigatewayv2_api.event_stream_api.api_endpoint}/event-stream"
}