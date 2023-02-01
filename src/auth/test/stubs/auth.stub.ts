import { AuthDto } from 'src/auth/dto';
export const authStub = (): AuthDto => ({
  email: 'stub@mail.com',
  password: '11223344',
});
