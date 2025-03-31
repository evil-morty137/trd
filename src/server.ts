import 'dotenv/config'
import app from "./app";
import mongoose from 'mongoose';

async function bootstrap() {
    try {
        //
        await mongoose.connect(process.env.DATABASE_URL)
        // console.log('database connected')

    } catch (error) {
        console.log('unable to connect to db', { reason: error })
    }

    // console.log(process.env.DATABASE_URL)
    const PORT = process.env.PORT || 2001
    const server = app.listen(PORT, () => {
        console.log(`connected to port`, { PORT })
    })

    const exitHandler = () => server.close(() => {
        console.log('server closed', { PORT });
        process.exit(0);
    });
}
bootstrap();
