import folderImg from '../../../assets/sabic_icons/upload_filetype_icon/folder_icon.svg'
import styles from './AffliateFolder.module.scss'
const EcmClickableBox = ({ key, handleFolderClick, data, parentData }) => {
  return (
    <div
      className={`${styles.clickContainerBox}`}
      key={key}
      data-static-id='EcmClickableBox.js_div_c77ff5'
    >
      <div
        className={`${styles.folderIcon}`}
        onClick={() => handleFolderClick(data.data, parentData ?? null)}
        data-static-id='EcmClickableBox.js_div_64fe89'
      >
        <img
          src={folderImg}
          alt={'folder_icon.svg'}
          data-static-id='EcmClickableBox.js_img_5925b4'
        />
      </div>
      <p
        className={`text-14-regular text-uppercase text-center ${styles.labelText}`}
        onClick={() => handleFolderClick(data.data, parentData ?? null)}
        data-testid={data.label}
        data-static-id='EcmClickableBox.js_p_fd1fe5'
      >
        {data.label}
      </p>
    </div>
  )
}
export default EcmClickableBox
