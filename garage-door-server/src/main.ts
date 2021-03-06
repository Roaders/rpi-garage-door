require('dotenv').config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import chalk from 'chalk';
import { getSSLConfig, getPort, parseConfig } from './helpers';

const serverConfig = parseConfig(process.env);
const httpsOptions = getSSLConfig(serverConfig);

if (httpsOptions != null) {
    console.log(`Configuring HTTPS.`);
} else {
    console.log(chalk.red(`No certificate defined. Starting in http only mode.`));
}

async function bootstrap() {
    const port = getPort(serverConfig);
    const app = await NestFactory.create(AppModule, { httpsOptions });

    app.enableShutdownHooks();

    const useStaticAssets = app.getHttpAdapter().useStaticAssets?.bind(app.getHttpAdapter());
    if (serverConfig.imagePath != null && useStaticAssets != null) {
        useStaticAssets(serverConfig.imagePath, { prefix: '/images/' });
    }

    await app.listen(port);

    if (httpsOptions) {
        console.log(`HTTPS listening on port ${port}`);
    } else {
        console.log(`HTTP listening on port ${port}`);
    }
}
bootstrap();
