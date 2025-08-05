import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, QueryFailedError } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      if (createUserDto.username) {
        const existingUsername = await this.userRepository.findOne({
          where: { username: createUserDto.username },
        });

        if (existingUsername) {
          throw new ConflictException('Username is already taken');
        }
      }

      const user = this.userRepository.create(createUserDto);
      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const dbError = error as any;

        if (dbError.code === '23505' || dbError.code === 'ER_DUP_ENTRY') {
          if (
            dbError.detail?.includes('email') ||
            dbError.message?.includes('email')
          ) {
            throw new ConflictException('User with this email already exists');
          }
          if (
            dbError.detail?.includes('username') ||
            dbError.message?.includes('username')
          ) {
            throw new ConflictException('Username is already taken');
          }
          throw new ConflictException(
            'A user with this information already exists',
          );
        }

        throw new InternalServerErrorException(
          'Failed to create user due to database error',
        );
      }

      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An unexpected error occurred while creating the user',
      );
    }
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }
}
