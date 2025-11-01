import os
import sys
sys.path.insert(0, 'package/')
import json
import requests
import logging


from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def parse_pipeline_event(event, service='Service'):
    detail = event['detail']
    users_to_at = [f'<@{os.getenv("DISCORD_USER_TO_MENTION")}>'] if detail['state'] == 'FAILED' else ['None :)']
    notification =  f'Pipeline {detail["pipeline"]} failed on stage: {event["additionalAttributes"]["failedStage"]}' if detail['state'] == 'FAILED' else f'Pipeline {detail["pipeline"]} has released a new version!'
    return [
        {
            'name': 'Time',
            'value': datetime.strptime(event['time'],'%Y-%m-%dT%H:%M:%SZ').strftime('%H:%M:%S %m/%d/%Y') ,
            'inline': True
        },
        {
            'name': 'Info',
            'value': notification,
            'inline': True
        },
        {
            'name': 'Mention',
            'value': ', '.join(users_to_at),
            'inline': True
        }
    ]

def parse_cloudwatch_alarm(message):

    notification = f'Alarm: {message["AlarmName"]} was triggered'
    users_to_at = [f'<@{os.getenv("DISCORD_USER_TO_MENTION")}>']
    return [
        {
            'name': 'Time',
            'value': datetime.strptime(message['StateChangeTime'],'%Y-%m-%dT%H:%M:%S.%f%z').strftime('%H:%M:%S %m/%d/%Y') ,
            'inline': True
        },
        {
            'name': 'Info',
            'value': notification,
            'inline': True
        },
        {
            'name': 'Mention',
            'value': ', '.join(users_to_at),
            'inline': True
        }
    ]


def lambda_handler(event, context):
    logger.info(f'Event Recieved: {event}')
    webhook_url = os.getenv('DISCORD_NOTIFICATION_WEBHOOK_URL')
    parsed_message = []
    for record in event.get('Records', []):
        sns_message = json.loads(record['Sns']['Message'])
        if 'detailType' in sns_message:
            parsed_message = parse_pipeline_event(sns_message)

        if 'AlarmName' in sns_message:
            parsed_message = parse_cloudwatch_alarm(sns_message)

        if parsed_message == []:
            parsed_message = [{
                'name': 'Something not parsed happened',
                'value': json.dumps(sns_message)
            }]
        logger.info(f'message: {parsed_message}')
        dicord_data = {
            'avatar_url': 'https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png',
            'embeds': [{
                'color': 3134049,
                'fields': parsed_message
            }]
        }

        headers = {'content-type': 'application/json'}
        response = requests.post(webhook_url, data=json.dumps(dicord_data),
                                 headers=headers)

        logging.info(f'Discord response: {response.status_code}')
        logging.info(response.content)
