import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common';
import { from, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../../modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { WHITELIST_ROUTES } from 'src/config/security.config';

@Injectable()
export class JwtInterceptor implements NestInterceptor {
    constructor(
        private authService: AuthService,
        private jwtService: JwtService
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const path = request.route.path;
        console.log(`JwtInterceptor: Intercepting request for path: ${path}`);

        // Check if the path is in the whitelist
        if (WHITELIST_ROUTES.includes(path)) {
            console.log('JwtInterceptor: Path is whitelisted, skipping token check');
            return next.handle();
        }

        const token = this.extractTokenFromHeader(request);
        console.log('JwtInterceptor: Extracted token:', token);

        if (!token) {
            console.log('JwtInterceptor: No token found');
            throw new UnauthorizedException('No token provided');
        }

        try {
            // Verify the token
            const payload = this.jwtService.verify(token);
            console.log('JwtInterceptor: Token verified successfully');

            // Check expiration
            const now = new Date();
            const expirationDate = new Date(payload.exp * 1000);
            console.log(`JwtInterceptor: Token expiration date: ${expirationDate}`);
            console.log(`JwtInterceptor: Current date: ${now}`);

            if (expirationDate < now) {
                console.log('JwtInterceptor: Token has expired');
                return this.handleExpiredToken(request, next);
            }

            // Token is valid and not expired
            request.user = payload;
            console.log('JwtInterceptor: Token is valid and not expired');
        } catch (error) {
            console.log('JwtInterceptor: Token verification failed', error);
            if (error.name === 'TokenExpiredError') {
                return this.handleExpiredToken(request, next);
            } else if (error.name === 'JsonWebTokenError') {
                console.log('JwtInterceptor: Invalid token signature');
                throw new UnauthorizedException('Invalid token signature');
            } else {
                console.log('JwtInterceptor: Unexpected error during token verification');
                throw new UnauthorizedException('Invalid token');
            }
        }

        return next.handle();
    }


    private extractTokenFromHeader(request: any): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }

    private handleExpiredToken(request: any, next: CallHandler): Observable<any> {
        const refreshToken = request.cookies['refresh_token'];

        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        return from(this.authService.refreshToken(refreshToken)).pipe(
            switchMap(({ access_token, refresh_token }) => {
                request.headers.authorization = `Bearer ${access_token}`;
                // Set the new refresh token as a cookie
                request.res.cookie('refresh_token', refresh_token, { httpOnly: true, secure: true });
                // Retry the original request with the new access token
                return next.handle();
            }),
            catchError((error) => {
                console.error('Token refresh failed:', error);
                return throwError(() => new UnauthorizedException('Failed to refresh token'));
            })
        );
    }
}