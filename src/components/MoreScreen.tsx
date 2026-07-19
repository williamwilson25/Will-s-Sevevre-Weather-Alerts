import { OutlookMapIcon, CameraIcon, MapPinIcon, UserIcon, ChevronDownIcon } from './icons';

interface Props {
  onOpenOutlook: () => void;
  onOpenReports: () => void;
  onOpenSubscriptions: () => void;
  onOpenSettings: () => void;
}

export default function MoreScreen({
  onOpenOutlook,
  onOpenReports,
  onOpenSubscriptions,
  onOpenSettings,
}: Props) {
  return (
    <div className="more-view">
      <header className="subscreen-header">
        <h1>More</h1>
      </header>
      <section className="settings-card">
        <ul className="settings-list">
          <li>
            <button type="button" className="settings-row" onClick={onOpenOutlook}>
              <OutlookMapIcon size={18} className="settings-row-icon" />
              <span className="settings-row-label">Storm Outlook</span>
              <ChevronDownIcon size={14} className="settings-row-chevron" />
            </button>
          </li>
          <li>
            <button type="button" className="settings-row" onClick={onOpenReports}>
              <CameraIcon size={18} className="settings-row-icon" />
              <span className="settings-row-label">Storm Reports</span>
              <ChevronDownIcon size={14} className="settings-row-chevron" />
            </button>
          </li>
          <li>
            <button type="button" className="settings-row" onClick={onOpenSubscriptions}>
              <MapPinIcon size={18} className="settings-row-icon" />
              <span className="settings-row-label">My Subscriptions</span>
              <ChevronDownIcon size={14} className="settings-row-chevron" />
            </button>
          </li>
          <li>
            <button type="button" className="settings-row" onClick={onOpenSettings}>
              <UserIcon size={18} className="settings-row-icon" />
              <span className="settings-row-label">Settings</span>
              <ChevronDownIcon size={14} className="settings-row-chevron" />
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
}
