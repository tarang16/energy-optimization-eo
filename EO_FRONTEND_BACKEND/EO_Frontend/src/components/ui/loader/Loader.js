import { LoaderAtom } from 'atoms/LoaderAtom'
import { useAtom } from 'jotai'
import styles from './Loader.module.scss'
export default function Loader(props) {
  const [loaderVal] = useAtom(LoaderAtom)
  return (
    <div
      role={'progressbar'}
      id={props.id}
      data-testid={props.id}
      className={`${styles.loaderContainer} centerPositionLoader`}
      data-static-id='Loader.js_div_f7d867'
    >
      <img
        alt=''
        src={loaderVal}
        className={`${styles.loader}`}
        data-static-id='Loader.js_img_5470d6'
      />
    </div>
  )
}
