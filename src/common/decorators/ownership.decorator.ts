import { SetMetadata } from '@nestjs/common';

export type OwnershipResource = 'garden' | 'vegetable';
export type OwnershipSource = 'param' | 'body' | 'query';

export type OwnershipConfig = {
  resource: OwnershipResource;
  source: OwnershipSource;
  key: string;
};

export const OWNERSHIP_KEY = 'ownership';
export const CheckOwnership = (config: OwnershipConfig) =>
  SetMetadata(OWNERSHIP_KEY, config);

// Lấy :id từ param, check garden ownership
//@CheckOwnership({ resource: 'garden', source: 'param', key: 'id' })

// Lấy gardenId từ body, check garden ownership  
//@CheckOwnership({ resource: 'garden', source: 'body', key: 'gardenId' })

// Lấy :id từ param, check vegetable ownership
//@CheckOwnership({ resource: 'vegetable', source: 'param', key: 'id' })