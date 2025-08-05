import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, QueryFailedError } from 'typeorm';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      this.logger.log('Starting user creation process');
      this.logger.debug('User data to create:', {
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        username: createUserDto.username,
        hasPassword: !!createUserDto.password,
        phone: createUserDto.phone,
        dateOfBirth: createUserDto.dateOfBirth,
        gender: createUserDto.gender,
        bio: createUserDto.bio,
      });

      // Check database connection
      this.logger.debug('Checking database connection...');
      const connection = this.userRepository.manager.connection;
      this.logger.debug('Database connection status:', {
        isConnected: connection.isConnected,
        name: connection.name,
        driver: connection.driver.constructor.name,
      });

      // Check if user with email already exists
      this.logger.debug(
        'Checking for existing user with email:',
        createUserDto.email,
      );
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        this.logger.warn(
          'User creation failed: Email already exists:',
          createUserDto.email,
        );
        throw new ConflictException('User with this email already exists');
      }
      this.logger.debug('Email check passed - no existing user found');

      // Check if username is provided and already exists
      if (createUserDto.username) {
        this.logger.debug(
          'Checking for existing username:',
          createUserDto.username,
        );
        const existingUsername = await this.userRepository.findOne({
          where: { username: createUserDto.username },
        });

        if (existingUsername) {
          this.logger.warn(
            'User creation failed: Username already exists:',
            createUserDto.username,
          );
          throw new ConflictException('Username is already taken');
        }
        this.logger.debug('Username check passed - no existing username found');
      }

      // Create the user entity
      this.logger.debug('Creating user entity...');
      const user = this.userRepository.create(createUserDto);
      this.logger.debug('User entity created:', {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
      });

      // Save the user
      this.logger.debug('Saving user to database...');
      const savedUser = await this.userRepository.save(user);
      this.logger.debug('User saved successfully:', {
        id: savedUser.id,
        email: savedUser.email,
        createdAt: savedUser.createdAt,
      });

      this.logger.log('User creation completed successfully');
      return savedUser;
    } catch (error) {
      this.logger.error('User creation failed with error:', error);
      this.logger.error('Error name:', error.name);
      this.logger.error('Error message:', error.message);
      this.logger.error('Error stack:', error.stack);

      // Handle database constraint violations
      if (error instanceof QueryFailedError) {
        const dbError = error as any;
        this.logger.error('Database error details:', {
          code: dbError.code,
          detail: dbError.detail,
          constraint: dbError.constraint,
          table: dbError.table,
          column: dbError.column,
          severity: dbError.severity,
          routine: dbError.routine,
        });

        // Handle unique constraint violations
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

        // Handle other database errors
        this.logger.error(
          'Unhandled database error during user creation:',
          dbError,
        );
        throw new InternalServerErrorException(
          `Database error: ${dbError.message}`,
        );
      }

      // If it's already a NestJS exception, re-throw it
      if (error instanceof ConflictException) {
        throw error;
      }

      // Log unexpected errors with full details
      this.logger.error('Unexpected error during user creation:', {
        errorType: error.constructor.name,
        message: error.message,
        stack: error.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });

      throw new InternalServerErrorException(
        `An unexpected error occurred while creating the user: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<User[]> {
    try {
      this.logger.debug('Fetching all users...');
      const users = await this.userRepository.find();
      this.logger.debug(`Found ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error('Error fetching all users:', error);
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      this.logger.debug('Finding user by ID:', id);
      const user = await this.userRepository.findOne({
        where: { id },
      });

      if (!user) {
        this.logger.warn('User not found with ID:', id);
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.debug('User found successfully:', {
        id: user.id,
        email: user.email,
      });
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Error finding user with ID ${id}:`, error);
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      this.logger.debug('Finding user by email:', email);
      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (user) {
        this.logger.debug('User found by email:', {
          id: user.id,
          email: user.email,
        });
      } else {
        this.logger.debug('No user found with email:', email);
      }

      return user;
    } catch (error) {
      this.logger.error(`Error finding user with email ${email}:`, error);
      throw new InternalServerErrorException(
        'Failed to retrieve user by email',
      );
    }
  }
}
