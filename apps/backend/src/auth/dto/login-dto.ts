import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
    @ApiProperty({ 
        description: 'Email адрес пользователя',
        example: 'teacher@abai.edu.kz',
        format: 'email',
        type: String
    })
    @IsEmail({}, { message: 'Введите корректный email адрес' })
    email: string;

    @ApiProperty({ 
        description: 'Пароль пользователя',
        example: 'securePassword123',
        minLength: 6,
        type: String
    })
    @IsString({ message: 'Пароль должен быть строкой' })
    password: string;

    @ApiPropertyOptional({ 
        description: 'Запомнить меня (увеличивает время жизни токена)',
        example: true,
        default: false,
        type: Boolean
    })
    @IsOptional()
    @IsBoolean({ message: 'RememberMe должно быть boolean значением' })
    rememberMe?: boolean;
}
