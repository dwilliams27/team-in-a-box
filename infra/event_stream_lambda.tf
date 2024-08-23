# --- event -> lambda -> SQS ---
resource "aws_lambda_function" "event_stream_lambda" {
  filename      = "${path.module}/event_stream_lambda/lambda_function.zip"
  function_name = "event-stream-lambda"
  role          = aws_iam_role.lambda_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.9"
  timeout = 30

  source_code_hash = filebase64sha256("${path.module}/event_stream_lambda/lambda_function.zip")

  vpc_config {
    subnet_ids         = [aws_subnet.private.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      SQS_QUEUE_URL = aws_sqs_queue.event_stream_queue.url
    }
  }
}
