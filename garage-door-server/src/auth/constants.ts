if (!process.env.jwtSecret) {
    throw new Error(`jwtSecret not defined in '.env'. Run 'npm run generate-secret' to create one.`);
}

export const jwtConstants = {
    secret: process.env.jwtSecret,
    tokenExpiry: '5m',
    refreshExpiry: '14 days',
};
