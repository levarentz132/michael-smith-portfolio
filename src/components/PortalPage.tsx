import React from 'react';
import { ProfilePage } from './ProfilePage';
import type { ProfilePageProps } from './ProfilePage';

export const PortalPage: React.FC<ProfilePageProps> = (props) => {
  return <ProfilePage {...props} />;
};
