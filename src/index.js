const { v4 } = require("uuid");
const AWS = require("aws-sdk");
const {SSM} = require("aws-sdk")

const sns = new AWS.SNS({ apiVersion: '2010-03-31' });

module.exports.getUser = async (event) => {
  try {
    const dynamodb = new AWS.DynamoDB.DocumentClient();

    const result = await dynamodb
      .scan({
        TableName: "usersTable",
      })
      .promise();

    const users = result.Items;

    return {
      status: 200,
      body: { users },
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
};

module.exports.addUser = async (event) => {
  try {
    const dynamodb = new AWS.DynamoDB.DocumentClient();

    const { nombre, cedula } = JSON.parse(event.body);
    const id = v4();

    const newUser = {
      id,
      nombre,
      cedula,
    };

    await dynamodb
      .put({
        TableName: "usersTable",
        Item: newUser,
      })
      .promise();

    return {
      status: 200,
      body: JSON.stringify(newUser),
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
};

module.exports.updateUser = async (event) => {
  try {
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    const { id } = event.pathParameters;

    const { nombre, cedula } = JSON.parse(event.body);

    await dynamodb
      .update({
        TableName: "usersTable",
        Key: { id },
        UpdateExpression: "set nombre = :nombre, cedula = :cedula",
        ExpressionAttributeValues: {
          ":nombre": nombre,
          ":cedula": cedula,
        },
        ReturnValues: "ALL_NEW",
      })
      .promise();

    return {
      status: 200,
      body: JSON.stringify({
        message: "users updated",
      }),
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
};

module.exports.deleteUser = async (event) => {

  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const { id } = event.pathParameters;

  await dynamodb.delete({
    TableName: 'usersTable',
    Key:{
      id
    }
  }).promise()

  return{
    status: 200,
    body: {
      message: "User deleted"
    }
  }

};

// Enviar notificación por correo electrónico usando SNS
module.exports.sendNotificationByEmail = async (event) => {
  try {
    // Parse the body of the event
    const ssm = new SSM();

    const globalArn = (await ssm.getParameter({Name: "/dev/sns-serverless"}).promise()).Parameter.Value;
    const body = JSON.parse(event.body);

    // Extract the message from the body
    const message = body.message;

    // Check if the message is provided
    if (!message) {
      throw new Error('Message is missing');
    }

    // Send the notification
    await sns.publish({
      Subject: 'Notificación',
      Message: message,
      TopicArn: globalArn, // Reemplaza con el ARN de tu tema SNS
    }).promise();
    
    console.log('Notificación por correo electrónico enviada con éxito.');

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Notification sent successfully'
      })
    };
  } catch (error) {
    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error al enviar la notificación por correo electrónico',
        message: error.message
      })
    };
  }
};
