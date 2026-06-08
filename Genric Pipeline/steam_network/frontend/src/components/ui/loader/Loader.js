import loader1 from 'assets/sabic_icons/loaders/loader_1.svg'
import loader2 from 'assets/sabic_icons/loaders/loader_2.svg'
import loader3 from 'assets/sabic_icons/loaders/loader_3.svg'
import loader4 from 'assets/sabic_icons/loaders/loader_4.svg'
import loader5 from 'assets/sabic_icons/loaders/loader_5.svg'
import { useMemo } from 'react'
import styles from './Loader.module.scss'

const LOADERS = [loader1, loader2, loader3, loader4, loader5]

export default function Loader({ id }) {
  const src = useMemo(() => LOADERS[Math.floor(Math.random() * LOADERS.length)], [])
  return (
    <div
      role='progressbar'
      id={id}
      data-testid={id}
      className={`${styles.loaderContainer} centerPositionLoader`}
    >
      <img alt='Loading' src={src} className={styles.loader} />
    </div>
  )
}
