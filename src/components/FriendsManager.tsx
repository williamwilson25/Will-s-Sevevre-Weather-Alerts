import { useState } from 'react';
import type { DeliveryMethod, Friend, Location } from '../types';
import Avatar from './Avatar';
import { MapPinIcon, DiscordIcon, BellAlertIcon } from './icons';

interface Props {
  friends: Friend[];
  onChange: (friends: Friend[]) => void;
  onViewLocation?: (location: Location) => void;
}

export default function FriendsManager({ friends, onChange, onViewLocation }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('text');
  const [error, setError] = useState('');

  function addFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (deliveryMethod === 'text' && !phone.trim()) {
      setError('Add a phone number so they can receive text alerts.');
      return;
    }
    setError('');
    const friend: Friend = {
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim(),
      deliveryMethod,
    };
    onChange([...friends, friend]);
    setName('');
    setPhone('');
    setDeliveryMethod('text');
  }

  function removeFriend(id: string) {
    onChange(friends.filter((f) => f.id !== id));
  }

  function setFriendDelivery(id: string, method: DeliveryMethod) {
    onChange(friends.map((f) => (f.id === id ? { ...f, deliveryMethod: method } : f)));
  }

  return (
    <section className="friends-manager">
      <h2>Friends</h2>
      <form className="friend-form" onSubmit={addFriend}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Friend name"
        />
        <div className="friend-delivery-toggle" role="radiogroup" aria-label="How they receive alerts">
          <button
            type="button"
            className={deliveryMethod === 'text' ? 'active' : ''}
            onClick={() => setDeliveryMethod('text')}
          >
            Text
          </button>
          <button
            type="button"
            className={deliveryMethod === 'discord' ? 'active' : ''}
            onClick={() => setDeliveryMethod('discord')}
          >
            <DiscordIcon size={13} />
            Discord
          </button>
        </div>
        {deliveryMethod === 'text' && (
          <input
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-label="Friend phone"
          />
        )}
        {deliveryMethod === 'discord' && (
          <p className="friend-discord-hint">
            They'll get alerts through the shared Discord channel — no phone number needed.
          </p>
        )}
        <button type="submit">Add friend</button>
      </form>
      {error && <p className="form-error">{error}</p>}

      {friends.length === 0 ? (
        <p className="empty-state">No friends added yet. Add one above to start sending alerts.</p>
      ) : (
        <ul className="friend-list">
          {friends.map((friend) => (
            <li key={friend.id} className="friend-item">
              <Avatar name={friend.name} />
              <div className="friend-info">
                <div className="friend-name">
                  {friend.name}
                  {friend.uid && <span className="friend-subscriber-badge">Signed up</span>}
                </div>
                {friend.uid ? (
                  <div className="friend-delivery-toggle friend-delivery-toggle-inline" role="radiogroup" aria-label={`How ${friend.name} receives alerts`}>
                    <button
                      type="button"
                      className={(friend.deliveryMethod ?? 'text') === 'text' ? 'active' : ''}
                      onClick={() => setFriendDelivery(friend.id, 'text')}
                    >
                      Text
                    </button>
                    <button
                      type="button"
                      className={friend.deliveryMethod === 'app' ? 'active' : ''}
                      onClick={() => setFriendDelivery(friend.id, 'app')}
                    >
                      <BellAlertIcon size={12} />
                      App
                    </button>
                    <button
                      type="button"
                      className={friend.deliveryMethod === 'discord' ? 'active' : ''}
                      onClick={() => setFriendDelivery(friend.id, 'discord')}
                    >
                      <DiscordIcon size={12} />
                      Discord
                    </button>
                  </div>
                ) : (
                  <div className="friend-contact">
                    {friend.deliveryMethod === 'discord' ? (
                      <span className="friend-delivery-badge">
                        <DiscordIcon size={12} /> Discord
                      </span>
                    ) : (
                      friend.phone
                    )}
                  </div>
                )}
                {friend.location && (
                  <div className="friend-contact">
                    <MapPinIcon size={11} />{' '}
                    {friend.location.name}
                    {friend.location.admin1 ? `, ${friend.location.admin1}` : ''}
                  </div>
                )}
              </div>
              {friend.location && onViewLocation && (
                <button
                  type="button"
                  className="friend-view-location"
                  onClick={() => onViewLocation(friend.location!)}
                  title="Switch the app to their location"
                >
                  View
                </button>
              )}
              <button type="button" className="friend-remove" onClick={() => removeFriend(friend.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
