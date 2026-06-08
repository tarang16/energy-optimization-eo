import { useState } from 'react'
import styles from './ActivityTracker.module.scss'
export default function Affiliate_Tab_Changer({
  tabsData = [],
  text = '',
  selectedTab,
  onTabChange,
  imgSrc = '',
  imgAlt = '',
}) {
  const [activeTab, setActiveTab] = useState(
    selectedTab ? selectedTab : `${tabsData?.[0]?.key || ''}`,
  )
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey)
    if (onTabChange) onTabChange(tabKey)
  }
  return (
    <div
      className={`${styles.tabsContainer} d-flex flex-row align-items-center gap-2`}
      data-static-id='Affiliate_Tab_Changer.js_div_d3c439'
    >
      <div
        className={`${styles.activeUserContent}`}
        data-static-id='Affiliate_Tab_Changer.js_div_a6c606'
      >
        {imgSrc && (
          <img
            alt={imgAlt}
            src={imgSrc}
            className={`${styles.activeUserIcon}`}
            data-static-id='Affiliate_Tab_Changer.js_img_726d9b'
          />
        )}
        <p
          className='mb-0 text-14-regular mt_03 text_primary_blue text-uppercase text-nowrap'
          data-static-id='Affiliate_Tab_Changer.js_p_0a818b'
        >
          {text}
        </p>
      </div>

      <ul
        className={`${styles.tabList} text-12-regular text_primary_gray`}
        data-static-id='Affiliate_Tab_Changer.js_ul_bbab59'
      >
        {tabsData.map((tab) => (
          <li
            key={tab.key}
            className={`${styles.tabItem} ${activeTab === tab.key ? styles.active : styles.inactive}`}
            onClick={() => handleTabChange(tab.key)}
            data-static-id='Affiliate_Tab_Changer.js_li_95a25e'
          >
            {tab.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
