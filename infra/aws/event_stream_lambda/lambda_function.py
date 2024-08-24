import json
import boto3
import os
import logging

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    # Initialize SQS client
    sqs = boto3.client('sqs')
    
    # Get the SQS queue URL from environment variable
    queue_url = os.environ['SQS_QUEUE_URL']
    
    # Log the incoming event
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Parse the incoming event body
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event  # In case the event itself is the body
        
        # Log the parsed body
        logger.info(f"Parsed body: {json.dumps(body)}")
        
        # Check for Slack challenge
        if 'challenge' in body:
            logger.info("Received Slack challenge")
            return {
                'statusCode': 200,
                'body': json.dumps({'challenge': body['challenge']})
            }
        
        # Slack message event
        if body['type'] == 'event_callback':
            if body['event']['type'] == 'message':
                logger.info(f"Received message: {body['event']['text']}")
        
                # Send message to SQS
                response = sqs.send_message(
                    QueueUrl=queue_url,
                    MessageBody=json.dumps({
                        'slack': {
                            'user': body['event']['user'],
                            'text': body['event']['text'],
                            'client_msg_id': body['event']['client_msg_id'],
                            'channel': body['event']['channel'],
                            'event_ts': body['event']['event_ts'],
                            'event_context': body['event_context'],
                        }  
                    })
                )
                
                # Log the SQS response
                logger.info(f"SQS response: {json.dumps(response)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps('Message sent to SQS successfully')
        }
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding JSON: {str(e)}")
        return {
            'statusCode': 400,
            'body': json.dumps('Invalid JSON in request body')
        }
    except Exception as e:
        # Log any errors
        logger.error(f"Error processing message: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps('Error processing message')
        }