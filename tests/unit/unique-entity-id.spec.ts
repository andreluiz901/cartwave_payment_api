import { validate as uuidValidate } from 'uuid';

import { UniqueEntityId } from '@core/domain/entities/unique-entity-id';
import { InvalidUuidError } from '@/core/errors/invalid-uuid.error';

describe('UniqueEntityId', () => {
  it('should throw error when uuid is invalid', () => {
    expect(() => new UniqueEntityId('fake id')).toThrow(InvalidUuidError);
  });

  it('should throw error with the invalid value in message', () => {
    expect(() => new UniqueEntityId('invalid')).toThrow('invalid');
  });

  it('should accept a valid uuid passed to constructor', () => {
    const uuid = '42002e24-baea-41a7-9da2-6464319bc9c6';
    const uniqueEntityId = new UniqueEntityId(uuid);

    expect(uniqueEntityId.toString()).toBe(uuid);
  });

  it('should generate a valid uuid when none is provided', () => {
    const uniqueEntityId = new UniqueEntityId();

    expect(uuidValidate(uniqueEntityId.toString())).toBe(true);
  });

  it('should generate different uuids for different instances', () => {
    const id1 = new UniqueEntityId();
    const id2 = new UniqueEntityId();
    const id3 = new UniqueEntityId();

    expect(id1.toString()).not.toBe(id2.toString());
    expect(id1.toString()).not.toBe(id3.toString());
    expect(id2.toString()).not.toBe(id3.toString());
  });
});
