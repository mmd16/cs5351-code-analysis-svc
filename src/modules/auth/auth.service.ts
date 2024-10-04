import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { ConfigService } from '@nestjs/config';
import { Token } from '../token/token.entity';
import { OAuthAccountInfo } from '../oauth-account-info/oauth-account-info.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Token)
        private tokenRepository: Repository<Token>,
        @InjectRepository(OAuthAccountInfo)
        private oauthAccountInfoRepository: Repository<OAuthAccountInfo>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    // async findOrCreateUser(profile: any, provider: string): Promise<User> {
    //     let user: User;
    //     // const oauthAccountInfo = await this.oauthAccountInfoRepository.findOne({ where: { oauthProvider: provider, memberId: profile.username } });
    //     user = await this.userRepository.findOne({ where: { id: profile.emails[0].value } });

    //     if (!user) {
    //         user = this.createUser(profile, provider);
    //         const savedUser = await this.userRepository.save(user);
    //         const oauthAccountInfo = new OAuthAccountInfo();
    //         oauthAccountInfo.oauthProvider = provider;
    //         oauthAccountInfo.memberId = profile.username;
    //         oauthAccountInfo.user = savedUser;
    //         await this.oauthAccountInfoRepository.save(oauthAccountInfo);


    //     } else {
    //         // Update existing user
    //         const oauthAccountInfo = await this.oauthAccountInfoRepository.findOne({ where: { oauthProvider: provider, memberId: profile.username } });
    //         user = this.updateUser(user, profile, provider);
    //         const savedUser = await this.userRepository.save(user);

    //         if (!oauthAccountInfo) {
    //             const oauthAccountInfo = new OAuthAccountInfo();
    //             oauthAccountInfo.oauthProvider = provider;
    //             oauthAccountInfo.memberId = profile.username;
    //             oauthAccountInfo.user = user;
    //             await this.oauthAccountInfoRepository.save(oauthAccountInfo);
    //         }
    //     }

    //     return user;
    // }

    async findOrCreateUser(profile: any, provider: string): Promise<User> {
        const email = profile.emails[0].value;
        const username = profile.username;

        // Attempt to retrieve user and their OAuth info simultaneously
        let user = await this.userRepository.findOne({
            where: { email: email },
            relations: ['oauthAccountInfo'] // Assuming 'oauthAccountInfo' is the correct relation name
        });

        if (!user) {
            // Create user and OAuthAccountInfo if not found
            user = await this.createUser(profile, provider);
        } else {
            // If user exists, update user and check/create OAuth info
            user = await this.updateUser(user, profile, provider);

            let oauthAccountInfo = await this.oauthAccountInfoRepository.findOne({
                where: { oauthProvider: provider, memberId: username }
            });

            if (!oauthAccountInfo) {
                oauthAccountInfo = new OAuthAccountInfo();
                oauthAccountInfo.oauthProvider = provider;
                oauthAccountInfo.memberId = username;
                oauthAccountInfo.user = user;
                await this.oauthAccountInfoRepository.save(oauthAccountInfo);
            }
        }

        return user;
    }

    private async createUser(profile: any, provider: string): Promise<User> {
        const user = new User(); // Set user properties based on profile
        user.email = profile.emails[0].value;
        user.userDisplayName = profile.displayName;

        const savedUser = await this.userRepository.save(user);

        const oauthAccountInfo = new OAuthAccountInfo();
        oauthAccountInfo.oauthProvider = provider;
        oauthAccountInfo.memberId = profile.username;
        oauthAccountInfo.user = savedUser;
        await this.oauthAccountInfoRepository.save(oauthAccountInfo);

        return savedUser;
    }

    private async updateUser(user: User, profile: any, provider: string): Promise<User> {
        // Update user properties
        user.email = profile.emails[0].value; // Example property update
        user.userDisplayName = profile.displayName;

        return await this.userRepository.save(user);
    }


    async createToken(user: User): Promise<Token> {
        let token = await this.tokenRepository.findOne({ where: { user: user } });

        if (!token) {
            token = new Token();
            token.user = user;
        }

        token.accessToken = this.generateAccessToken(user);
        token.refreshToken = this.generateRefreshToken(user);
        token.expiresDatetime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

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
        const token = await this.tokenRepository.findOne({
            where: { user: { id: user.id } },
            relations: ['user']
        });

        console.log(token.accessToken);

        return {
            access_token: token.accessToken,
            refreshToken: token.refreshToken
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
                where: { refreshToken: refreshToken },
                relations: ['User'],
            });
            console.log('AuthService: Found token in database:', token);

            if (!token) {
                console.log('AuthService: Token not found in database');
                throw new UnauthorizedException('Invalid refresh token');
            }

            const now = new Date();
            console.log('AuthService: Current time:', now);
            console.log('AuthService: Token expire time:', token.expiresDatetime);

            if (token.expiresDatetime < now) {
                console.log('AuthService: Token has expired');
                throw new UnauthorizedException('Refresh token has expired');
            }

            const user = token.user;
            console.log('AuthService: User associated with token:', user);

            const newAccessToken = this.generateAccessToken(user);

            token.accessToken = newAccessToken;
            token.refreshToken = refreshToken;
            token.expiresDatetime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
            await this.tokenRepository.save(token);
            console.log('AuthService: New tokens generated and saved');

            return {
                access_token: newAccessToken,
                refresh_token: refreshToken,
            };
        } catch (error) {
            console.error('AuthService: Refresh token error:', error);
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    private generateAccessToken(user: User): string {
        const payload = { sub: user.id, email: user.email, type: 'access' };
        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
        });
    }

    private generateRefreshToken(user: User): string {
        const payload = { sub: user.id, type: 'refresh' };
        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
        });
    }
}