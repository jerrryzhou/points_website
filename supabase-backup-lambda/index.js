const { execSync } = require('child_process');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const fs = require('fs');

const s3 = new S3Client({});
const secretsClient = new SecretsManagerClient({});

const DB_SECRET_ID = process.env.DB_SECRET_ID;
const BACKUP_BUCKET = process.env.BACKUP_BUCKET;

exports.handler = async () => {
  const secret = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: DB_SECRET_ID })
  );
  const dbUrl = secret.SecretString;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dumpPath = `/tmp/backup_${timestamp}.dump`;

  execSync(`pg_dump "${dbUrl}" --no-owner --no-acl -F c -f ${dumpPath}`, {
    env: { ...process.env, PATH: `${process.env.PATH}:/usr/bin` },
  });

  const fileContent = fs.readFileSync(dumpPath);
  await s3.send(new PutObjectCommand({
    Bucket: BACKUP_BUCKET,
    Key: `backup_${timestamp}.dump`,
    Body: fileContent,
  }));

  fs.unlinkSync(dumpPath);

  return { statusCode: 200, body: `Backup complete: backup_${timestamp}.dump` };
};
