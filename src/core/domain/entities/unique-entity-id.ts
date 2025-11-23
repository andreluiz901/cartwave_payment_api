import { InvalidUuidError } from '@/core/domain/errors/invalid-uuid.error';
import { v4 as uuidV4, validate as uuidValidate } from 'uuid';

export class UniqueEntityId {
  private readonly value: string;

  constructor(id?: string) {
    this.value = id || uuidV4();
    this.validate();
  }

  private validate() {
    const isValid = uuidValidate(this.value);

    if (!isValid) {
      throw new InvalidUuidError(this.value);
    }
  }

  toString() {
    return this.value;
  }
}
