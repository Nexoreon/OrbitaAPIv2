"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const hpp_1 = __importDefault(require("hpp"));
const AppError_1 = __importDefault(require("./utils/AppError"));
require("./modules/SchedulerModule");
require("./modules/TelegramBot/TelegramBotModule");
const errorHandler_1 = __importDefault(require("./controllers/errorHandler"));
const mainRoutes_1 = __importDefault(require("./routes/mainRoutes"));
const configurationRoutes_1 = __importDefault(require("./routes/configurationRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const iconRoutes_1 = __importDefault(require("./routes/iconRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const messengerRoutes_1 = __importDefault(require("./routes/messengerRoutes"));
const achievementRoutes_1 = __importDefault(require("./routes/achievementRoutes"));
const forumRoutes_1 = __importDefault(require("./routes/forumRoutes"));
const documentRoutes_1 = __importDefault(require("./routes/documentRoutes"));
const guideRoutes_1 = __importDefault(require("./routes/guideRoutes"));
const MultiTrackerRoutes_1 = __importDefault(require("./routes/miniapps/MultiTrackerRoutes"));
const SpotifyLibraryRoutes_1 = __importDefault(require("./routes/miniapps/SpotifyLibraryRoutes"));
const LinguaUniverseRoutes_1 = __importDefault(require("./routes/miniapps/LinguaUniverseRoutes"));
const packageRoutes_1 = __importDefault(require("./routes/miniapps/packageRoutes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, express_mongo_sanitize_1.default)());
app.use((0, hpp_1.default)());
const limitMessage = 'Слишком много запросов с этого IP адреса, пожалуйста попробуйте позже!';
const limiter = (0, express_rate_limit_1.default)({
    max: 500,
    windowMs: 60 * 60 * 1000,
    message: limitMessage,
});
const forumLimiter = (0, express_rate_limit_1.default)({
    max: 1000,
    windowMs: 5 * 60 * 1000,
    message: limitMessage,
});
app.use('/api', limiter);
app.use('/api/v1', mainRoutes_1.default);
app.use('/api/v1/applications', configurationRoutes_1.default);
app.use('/api/v1/icons', iconRoutes_1.default);
app.use('/api/v1/users', userRoutes_1.default);
app.use('/api/v1/dashboard', dashboardRoutes_1.default);
app.use('/api/v1/notifications', notificationRoutes_1.default);
app.use('/api/v1/messenger', messengerRoutes_1.default);
app.use('/api/v1/achievements', achievementRoutes_1.default);
app.use('/api/v1/forum', forumLimiter);
app.use('/api/v1/forum', forumRoutes_1.default);
app.use('/api/v1/docs', documentRoutes_1.default);
app.use('/api/v1/guides', guideRoutes_1.default);
app.use('/api/v1/linguaUniverse', LinguaUniverseRoutes_1.default);
app.use('/api/v1/mini-apps/multi-tracker', MultiTrackerRoutes_1.default);
app.use('/api/v1/mini-apps/spotify-library', SpotifyLibraryRoutes_1.default);
app.use('/api/v1/mini-apps/npm-packages', packageRoutes_1.default);
app.all('*', (req, res, next) => {
    next(new AppError_1.default(`Невозможно найти ${req.originalUrl} на сервере`, 404));
});
app.use(errorHandler_1.default);
exports.default = app;
