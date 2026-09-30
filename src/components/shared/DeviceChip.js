import { device } from '../../data/devices';
import styles from './DeviceChip.module.css';

// A small "recorded with" pill: brand icon plus name. `compact` drops the
// label and keeps it as a tooltip, for tight rows.
export default function DeviceChip({ id, compact = false }) {
  const d = device(id);
  return (
    <span className={`${styles.chip} ${compact ? styles.compact : ''}`} title={`Recorded with ${d.label}`}>
      <i className={d.icon} style={{ color: d.color }} aria-hidden="true" />
      {compact ? <span className={styles.srOnly}>{d.label}</span> : d.label}
    </span>
  );
}
