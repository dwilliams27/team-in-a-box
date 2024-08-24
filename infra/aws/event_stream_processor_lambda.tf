# --- SQS -> lambda -> mongo ---
resource "aws_lambda_function" "event_stream_processor_lambda" {
  filename         = "${path.module}/event_stream_processor_lambda/lambda_function.zip"
  function_name    = "event-stream-processor-lambda"
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.8"
  timeout = 30

  source_code_hash = filebase64sha256("${path.module}/event_stream_processor_lambda/lambda_function.zip")

  vpc_config {
    subnet_ids         = [aws_subnet.private.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
  
  environment {
    variables = {
      MONGO_DB_URI  = "${var.MONGO_DB_URI}"
      MONGO_DB_NAME = "BoxDB"
    }
  }
}
