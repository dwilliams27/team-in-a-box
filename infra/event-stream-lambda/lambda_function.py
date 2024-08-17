import json
import boto3
import os

def lambda_handler(event, context):
    # Initialize SQS client
    sqs = boto3.client('sqs')
    
    # Get the SQS queue URL from environment variable
    queue_url = os.environ['SQS_QUEUE_URL']
    
    # Parse the incoming event body
    body = json.loads(event['body'])
    
    # Send message to SQS
    response = sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(body)
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({ "success": True })
    }
