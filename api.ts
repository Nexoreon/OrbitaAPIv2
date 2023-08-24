import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import AppError from './utils/AppError';
import './modules/SchedulerModule';
import './modules/TelegramBot/TelegramBotModule';

import globalErrorHandler from './controllers/errorHandler';
import mainRoutes from './routes/mainRoutes';
import configurationRoutes from './routes/configurationRoutes';
import dashboardRoues from './routes/dashboardRoutes';
import userRoutes from './routes/userRoutes';
import iconRoutes from './routes/iconRoutes';
import notificationRoutes from './routes/notificationRoutes';
import messengerRoutes from './routes/messengerRoutes';
import achievementRoutes from './routes/achievementRoutes';
import forumRoutes from './routes/forumRoutes';
import documentRoutes from './routes/documentRoutes';
import guideRoutes from './routes/guideRoutes';
import multiTrackerRoutes from './routes/miniapps/MultiTrackerRoutes';
import spotifyLibraryRoutes from './routes/miniapps/SpotifyLibraryRoutes';
import LinguaUniverseRoutes from './routes/miniapps/LinguaUniverseRoutes';
import packageRoutes from './routes/miniapps/packageRoutes';

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(mongoSanitize());
app.use(hpp());

const limitMessage = 'Слишком много запросов с этого IP адреса, пожалуйста попробуйте позже!';
const limiter = rateLimit({
    max: 500,
    windowMs: 60 * 60 * 1000,
    message: limitMessage,
});

const forumLimiter = rateLimit({
    max: 1000,
    windowMs: 5 * 60 * 1000,
    message: limitMessage,
});

app.use('/api', limiter);
app.use('/api/v1', mainRoutes);
app.use('/api/v1/applications', configurationRoutes);
app.use('/api/v1/icons', iconRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dashboard', dashboardRoues);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/messenger', messengerRoutes);
app.use('/api/v1/achievements', achievementRoutes);
app.use('/api/v1/forum', forumLimiter);
app.use('/api/v1/forum', forumRoutes);
app.use('/api/v1/docs', documentRoutes);
app.use('/api/v1/guides', guideRoutes);
app.use('/api/v1/linguaUniverse', LinguaUniverseRoutes);
app.use('/api/v1/mini-apps/multi-tracker', multiTrackerRoutes);
app.use('/api/v1/mini-apps/spotify-library', spotifyLibraryRoutes);
app.use('/api/v1/mini-apps/npm-packages', packageRoutes);

app.all('*', (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Невозможно найти ${req.originalUrl} на сервере`, 404));
});
app.use(globalErrorHandler);

export default app;
