import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/database';
import { hashText, compareHash, generateSlug } from '../../common/helpers';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from '../../common/interfaces';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await hashText(dto.password);

    const companyName = `${dto.firstName} ${dto.lastName}'s Company`;
    const company = await this.prisma.company.create({
      data: {
        name: companyName,
        slug: generateSlug(companyName),
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: 'BUSINESS_OWNER',
        companyId: company.id,
      },
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(dto.email, dto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(user);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive || user.deletedAt) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isValid = await compareHash(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async generateTokens(user: any): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    ]);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const userResponse = new UserResponseDto({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      companyId: user.companyId,
    });

    return new AuthResponseDto({ accessToken, refreshToken, user: userResponse });
  }

  async googleLogin(profile: {
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    googleId: string;
  }): Promise<AuthResponseDto> {
    let user = await this.prisma.user.findUnique({ where: { googleId: profile.googleId } });

    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email: profile.email } });
    }

    if (!user) {
      const companyName = `${profile.firstName} ${profile.lastName}'s Company`;
      const company = await this.prisma.company.create({
        data: {
          name: companyName,
          slug: generateSlug(companyName),
        },
      });

      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatar: profile.avatar,
          googleId: profile.googleId,
          role: 'BUSINESS_OWNER',
          companyId: company.id,
          isVerified: true,
          password: '',
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.googleId,
          avatar: profile.avatar ?? user.avatar,
          isVerified: true,
        },
      });
    }

    return this.generateTokens(user);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; resetToken?: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'password_reset' },
      {
        secret: this.config.get('JWT_RESET_SECRET') || this.config.get('JWT_SECRET'),
        expiresIn: '1h',
      },
    );

    return {
      message: 'If the email exists, a reset link has been sent',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify(dto.token, {
        secret: this.config.get('JWT_RESET_SECRET') || this.config.get('JWT_SECRET'),
      });

      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Invalid reset token');
      }

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw new BadRequestException('Invalid reset token');
      }

      const hashedPassword = await hashText(dto.password);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return { message: 'Password reset successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await compareHash(oldPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await hashText(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, refreshToken, ...profile } = user;
    return profile;
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; avatar?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      },
    });

    const { password, refreshToken, ...profile } = updated;
    return profile;
  }
}
