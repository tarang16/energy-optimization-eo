import { edgeOptions } from '../utils'
import styles from './legend.module.scss'
const LegendBox = () => {
  return (
    <div
      className={`${styles.legendBoxCotainer} customLegendBoxCotainer`}
      data-static-id='index.js_div_a5cb58'
    >
      <div
        className={`${styles.actualOptimumContainer}`}
        data-static-id='index.js_div_642b43'
      >
        <div className={styles.legendCell} data-static-id='index.js_div_ab7012'>
          <div
            className={`${styles.colorBox} bg_primary_blue`}
            data-static-id='index.js_div_d8c5ca'
          ></div>
          <span
            className='text-10-regular text-uppercase mt_03'
            data-static-id='index.js_span_b3c89b'
          >
            Actual
          </span>
        </div>
        <div className={styles.legendCell} data-static-id='index.js_div_1c5a4a'>
          <div
            className={`${styles.colorBox} bg_primary_gray_2`}
            data-static-id='index.js_div_596fbb'
          ></div>
          <span
            className='text-10-regular text-uppercase mt_03'
            data-static-id='index.js_span_def49e'
          >
            Optimum
          </span>
        </div>
      </div>
      <div
        className={styles.legendContainer}
        data-static-id='index.js_div_677115'
      >
        <div className={styles.legendBox} data-static-id='index.js_div_c1c84c'>
          <div
            className={styles.legendGrid}
            data-static-id='index.js_div_ff8160'
          >
            {edgeOptions
              .filter((x) => x.name !== 'Default')
              .sort((a, b) => a.legendSortOrder - b.legendSortOrder)
              .map((item) => (
                <div
                  className={styles.legendCell}
                  key={item.label}
                  data-static-id='index.js_div_6ba37b'
                >
                  <div
                    className={styles.colorBox}
                    style={{
                      backgroundColor: item.bgColor,
                    }}
                    data-static-id='index.js_div_6b9050'
                  ></div>
                  <span
                    className='text-10-regular text-uppercase mt_03'
                    data-static-id='index.js_span_da8f45'
                  >
                    {item.name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
export default LegendBox
