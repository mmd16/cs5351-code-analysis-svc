import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { OAuthToken } from './oauth-token.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(OAuthToken)
        private tokenRepository: Repository<OAuthToken>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async findOrCreateUser(profile: any, provider: string): Promise<User> {
        let user: User;

        if (provider === 'github') {
            user = await this.userRepository.findOne({ where: { GithubId: profile.username } });
        } else if (provider === 'google') {
            user = await this.userRepository.findOne({ where: { GoogleId: profile.username } });
        }

        console.log(!user);

        if (!user) {
            user = this.createUser(profile, provider);
            return this.userRepository.save(user);
        } else {
            // Update existing user
            user = this.updateUser(user, profile, provider);
            return this.userRepository.save(user);
        }
    }

    private createUser(profile: any, provider: string): User {
        switch (provider) {
            case 'github':
                const user = new User();
                user.UserDisplayName = profile.displayName;
                user.GithubId = profile.username;
                user.Email = profile.emails[0].value;
                return user;
            case 'google':
                return null;
            default:
                throw new Error('Invalid provider');
        }
    }

    private updateUser(user: User, profile: any, provider: string): User {
        switch (provider) {
            case 'github':
                user.UserDisplayName = profile.displayName;
                user.Email = profile.emails[0].value;
                return user;
            case 'google':
                return null;
            default:
                throw new Error('Invalid provider');
        }
    }

    async createToken(user: User, provider: string): Promise<OAuthToken> {
        let token = await this.tokenRepository.findOne({ where: { User: user, Provider: provider } });
    
        if (!token) {
            token = new OAuthToken();
            token.User = user;
            token.Provider = provider;
        }
    
        token.AccessToken = this.generateAccessToken(user);
        token.RefreshToken = this.generateRefreshToken(user);
        token.ExpireDatetime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

        return this.tokenRepository.save(token);
    }

    // async createOAuthToken(user: User, accessToken: string, refreshToken: string, provider: string): Promise<OAuthToken> {
    //     let token = await this.tokenRepository.findOne({ where: { User: user, Provider: provider } });

    //     if (!token) {
    //         token = new OAuthToken();
    //         token.User = user;
    //         token.Provider = provider;
    //     }

    //     token.AccessToken = accessToken;
    //     token.RefreshToken = refreshToken;
    //     token.ExpireDatetime = new Date(Date.now() + 60); // 1 hour from now

    //     return this.tokenRepository.save(token);
    // }

    async login(user: User): Promise<{ refreshToken: string, access_token: string }> {
        const token = await this.tokenRepository.findOne({ where: { User: user, Provider: 'github' } });
        return {
            access_token: token.AccessToken,
            refreshToken: token.RefreshToken
        };
    }

    async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
        console.log('AuthService: Attempting to refresh token');
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            console.log('AuthService: Refresh token payload:', payload);

            const token = await this.tokenRepository.findOne({
                where: { RefreshToken: refreshToken },
                relations: ['User'],
            });
            console.log('AuthService: Found token in database:', token);

            if (!token) {
                console.log('AuthService: Token not found in database');
                throw new UnauthorizedException('Invalid refresh token');
            }

            const now = new Date();
            console.log('AuthService: Current time:', now);
            console.log('AuthService: Token expire time:', token.ExpireDatetime);

            if (token.ExpireDatetime < now) {
                console.log('AuthService: Token has expired');
                throw new UnauthorizedException('Refresh token has expired');
            }

            const user = token.User;
            console.log('AuthService: User associated with token:', user);

            const newAccessToken = this.generateAccessToken(user);
            const newRefreshToken = this.generateRefreshToken(user);

            token.AccessToken = newAccessToken;
            token.RefreshToken = newRefreshToken;
            token.ExpireDatetime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
            await this.tokenRepository.save(token);
            console.log('AuthService: New tokens generated and saved');

            return {
                access_token: newAccessToken,
                refresh_token: newRefreshToken,
            };
        } catch (error) {
            console.error('AuthService: Refresh token error:', error);
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    private generateAccessToken(user: User): string {
        const payload = { sub: user.ID, email: user.Email, type: 'access' };
        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
        });
    }

    private generateRefreshToken(user: User): string {
        const payload = { sub: user.ID, type: 'refresh' };
        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
        });
    }
}