module.exports = {
  influxDB: {
    url: process.env.INFLUX_URL,
    token: process.env.INFLUX_TOKEN,
    org: process.env.INFLUX_ORG,
    bucket: process.env.INFLUX_BUCKET,
  },
  auth0: {
    domain: process.env.AUTH0_DOMAIN,
    audience: process.env.AUTH0_AUDIENCE,
  },
};
