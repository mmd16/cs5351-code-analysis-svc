import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';

//swagger: add to "auth" tag
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req, @Res() res) {
    try {
      const { user } = req;
      const {access_token, refreshToken} = await this.authService.login(user);
      res.send({access_token, refreshToken});
    } catch (error) {
      console.error('GitHub authentication error:', error);
      res.status(500).json({ message: 'Authentication failed', error: error.message });
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res) {
    const { user } = req;
      const jwt = await this.authService.login(user);
      res.send(jwt);
  }
}