import crypto from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.TABLE_NAME;

const allowedStatuses = new Set(["OPEN", "IN_PROGRESS", "RESOLVED"]);

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS"
};

function response(statusCode, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}

function parseBody(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch {
    return null;
  }
}

export const handler = async (event) => {
  try {
    const method = event.httpMethod;
    const path = event.path;

    if (method === "OPTIONS") {
      return response(204, {});
    }

    if (method === "GET" && path.endsWith("/health")) {
      return response(200, {
        service: "qrfix-api",
        status: "healthy",
        timestamp: new Date().toISOString()
      });
    }

    if (method === "POST" && path.endsWith("/tickets")) {
      const body = parseBody(event);

      if (!body) {
        return response(400, { message: "Invalid JSON body." });
      }

      const required = ["siteId", "category", "description"];
      const missing = required.filter((field) => !String(body[field] || "").trim());

      if (missing.length > 0) {
        return response(400, {
          message: `Missing required fields: ${missing.join(", ")}`
        });
      }

      const now = new Date().toISOString();
      const datePart = now.slice(0, 10).replaceAll("-", "");
      const ticketId = `QF-${datePart}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

      const item = {
        ticketId,
        siteId: String(body.siteId).trim(),
        assetId: String(body.assetId || "").trim(),
        category: String(body.category).trim(),
        description: String(body.description).trim(),
        reporterName: String(body.reporterName || "Anonymous").trim(),
        phone: String(body.phone || "").trim(),
        imageUrl: String(body.imageUrl || "").trim(),
        priority: ["LOW", "MEDIUM", "HIGH"].includes(body.priority)
          ? body.priority
          : "MEDIUM",
        status: "OPEN",
        createdAt: now,
        updatedAt: now
      };

      await client.send(new PutCommand({
        TableName: tableName,
        Item: item,
        ConditionExpression: "attribute_not_exists(ticketId)"
      }));

      return response(201, item);
    }

    if (method === "GET" && path.endsWith("/tickets")) {
      const siteId = String(event.queryStringParameters?.siteId || "").trim();

      const commandInput = {
        TableName: tableName,
        ProjectionExpression:
          "ticketId, siteId, assetId, category, description, reporterName, phone, imageUrl, priority, #status, createdAt, updatedAt",
        ExpressionAttributeNames: {
          "#status": "status"
        }
      };

      if (siteId) {
        commandInput.FilterExpression = "siteId = :siteId";
        commandInput.ExpressionAttributeValues = {
          ":siteId": siteId
        };
      }

      const result = await client.send(new ScanCommand(commandInput));
      const items = (result.Items || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      return response(200, {
        count: items.length,
        items
      });
    }

    if (method === "PATCH" && event.pathParameters?.id) {
      const body = parseBody(event);
      const ticketId = event.pathParameters.id;
      const status = String(body?.status || "").toUpperCase();

      if (!allowedStatuses.has(status)) {
        return response(400, {
          message: "status must be OPEN, IN_PROGRESS, or RESOLVED"
        });
      }

      const result = await client.send(new UpdateCommand({
        TableName: tableName,
        Key: { ticketId },
        UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": status,
          ":updatedAt": new Date().toISOString()
        },
        ConditionExpression: "attribute_exists(ticketId)",
        ReturnValues: "ALL_NEW"
      }));

      return response(200, result.Attributes);
    }

    return response(404, { message: "Route not found." });
  } catch (error) {
    console.error("QRFix API error:", error);

    if (error.name === "ConditionalCheckFailedException") {
      return response(404, { message: "Ticket not found." });
    }

    return response(500, {
      message: "Internal server error.",
      requestId: event.requestContext?.requestId
    });
  }
};
