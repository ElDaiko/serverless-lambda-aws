const { v4 } = require("uuid");
const AWS = require("aws-sdk");

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
