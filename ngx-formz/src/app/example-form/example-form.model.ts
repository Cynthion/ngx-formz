import { ROOT_FORM } from 'projects/formz/src/lib/model';
import { DeepPartial, DeepRequired } from 'projects/formz/src/lib/utility-types';
import { enforce, omitWhen, only, staticSuite, test } from 'vest';

//#region FormModel

export interface Password {
  password: string;
  confirmPassword?: string;
}

export type UserGender = 'male' | 'female';
export type UserNationality = 'de' | 'fr' | 'jp';
export type UserReligion = 'christian' | 'islam' | 'hindu' | 'buddhism';

export interface User {
  firstName: string;
  lastName: string;
  gender?: UserGender;
  nationality?: UserNationality;
  religion?: UserReligion;
  passwords: Password;
}

export const initialPasswords: Password = {
  password: '',
  confirmPassword: ''
};

export const initialUser: User = {
  firstName: '',
  lastName: '',
  gender: undefined,
  nationality: undefined,
  religion: undefined,
  passwords: initialPasswords
};

export type ExampleFormModel = DeepPartial<User>;

//#endregion

//#region FormModel Validation

export type ExampleFormShape = DeepRequired<ExampleFormModel>;

export const exampleFormShape: ExampleFormShape = {
  firstName: '',
  lastName: '',
  gender: 'male', // TODO how to use undefined in shape?
  nationality: 'jp',
  religion: 'buddhism',
  passwords: {
    password: '',
    confirmPassword: ''
  }
};

export const exampleFormValidationSuite = staticSuite((model: ExampleFormModel, field?: string) => {
  if (field) {
    only(field);
  }

  test(ROOT_FORM, `Test User, your PW should not be '1234'!`, () => {
    enforce(model.firstName === 'Test' && model.lastName === 'User' && model.passwords?.password === '1234').isFalsy();
  });

  test('firstName', 'First name is required.', () => {
    enforce(model.firstName).isNotBlank();
  });

  test('lastName', 'Last name is required.', () => {
    enforce(model.lastName).isNotBlank();
  });

  test('passwords.password', 'Password is required.', () => {
    enforce(model.passwords?.password).isNotBlank();
  });

  omitWhen(!model.passwords?.password, () => {
    test('passwords.confirmPassword', 'Confirm password is required.', () => {
      enforce(model.passwords?.confirmPassword).isNotBlank();
    });
  });

  omitWhen(!model.passwords?.password || !model.passwords?.confirmPassword, () => {
    test('passwords', 'Passwords do not match!', () => {
      enforce(model.passwords?.confirmPassword).equals(model.passwords?.password);
    });
  });
});

//#endregion
