import { useState } from 'react';
import type { Friend } from '../types';

interface Props {
  friends: Friend[];
  onChange: (friends: Friend[]) => void;
}

export default function FriendsManager({ friends, onChange }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  function addFriend(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError('Add an email or phone number so they can receive alerts.');
      return;
    }
    setError('');
    const friend: Friend = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    };
    onChange([...friends, friend]);
    setName('');
    setEmail('');
    setPhone('');
  }

  function removeFriend(id: string) {
    onChange(friends.filter((f) => f.id !== id));
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
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Friend email"
        />
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-label="Friend phone"
        />
        <button type="submit">Add friend</button>
      </form>
      {error && <p className="form-error">{error}</p>}

      {friends.length === 0 ? (
        <p className="empty-state">No friends added yet. Add one above to start sending alerts.</p>
      ) : (
        <ul className="friend-list">
          {friends.map((friend) => (
            <li key={friend.id} className="friend-item">
              <div>
                <div className="friend-name">{friend.name}</div>
                <div className="friend-contact">
                  {[friend.email, friend.phone].filter(Boolean).join(' · ')}
                </div>
              </div>
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
