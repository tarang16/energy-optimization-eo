import {
  CompareValuesWithSymbol,
  formatWithUnitNum,
  formatWithUnitNumNa,
  getValsBaseOnCondition,
} from 'utills/utilities'
import styles from './TopTileTooltip.module.scss'
export default function TopTileTooltip({ data, apiData }) {
  return (
    <div
      className={`${styles.monitoringhTooltipContainer}`}
      data-static-id='TopTileTooltip.js_div_065943'
    >
      <div data-static-id='TopTileTooltip.js_div_ebb9e1'>
        <h1
          className='text-12-bold text-center mt-2 text_primary_gray pb-2'
          data-static-id='TopTileTooltip.js_h1_169668'
        >
          {data?.title}
        </h1>
        <div
          className='d-flex flex-column justify-content-between'
          data-static-id='TopTileTooltip.js_div_dd4e96'
        >
          {data?.title === 'PURCHASED ENERGY CONSUMPTION' ? (
            <>
              <div
                className={`${styles.AirSystemTooltip} w-100`}
                data-static-id='TopTileTooltip.js_div_682b98'
              >
                <div
                  className={`d-flex w-100 ${styles.contentWrapper}`}
                  data-static-id='TopTileTooltip.js_div_e98b8c'
                >
                  <div
                    className={`text-12-regular text_primary_gray text-uppercase ${styles.contentLeftCooling}`}
                    data-static-id='TopTileTooltip.js_div_529114'
                  ></div>
                  <div
                    className={`${styles.contentRightCooling} flexCenterContainer`}
                    data-static-id='TopTileTooltip.js_div_748319'
                  >
                    <div
                      className={`${styles.energyConsumption} text-12-regular text_primary_gray text-uppercase text-center`}
                      data-static-id='TopTileTooltip.js_div_620502'
                    >
                      NON RECONCILED
                    </div>
                    <div
                      className={`${styles.energyConsumption} text-12-regular text_primary_gray text-uppercase text-center`}
                      data-static-id='TopTileTooltip.js_div_0aceeb'
                    >
                      RECONCILED
                    </div>
                  </div>
                </div>

                <div
                  className={`d-flex align-items-center mt-1 py-1 ${styles.PrimaryBlueBg} ${styles.contentWrapper} w-100`}
                  data-static-id='TopTileTooltip.js_div_53cea2'
                >
                  <div
                    className={`text-12-regular text_primary_gray text-uppercase ${styles.contentLeftCooling}`}
                    data-static-id='TopTileTooltip.js_div_ac49fe'
                  >
                    Electricity
                  </div>
                  <div
                    className={`${styles.contentRightCooling} d-flex`}
                    data-static-id='TopTileTooltip.js_div_e29ccb'
                  >
                    <div
                      className={`${styles.energyConsumption} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_f90871'
                    >
                      {formatWithUnitNum(apiData?.energyConsumedElectricity)}
                    </div>
                    <div
                      className={`${styles.SmallBorderRight}`}
                      data-static-id='TopTileTooltip.js_div_e0fd12'
                    ></div>
                    <div
                      className={`${styles.energyConsumption} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_33cb5f'
                    >
                      {formatWithUnitNumNa(
                        apiData?.reconciledEnergyConsumedElectricity,
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`d-flex align-items-center mt-1 py-1 ${styles.PrimaryBlueBg} ${styles.contentWrapper} w-100`}
                  data-static-id='TopTileTooltip.js_div_65c4a5'
                >
                  <div
                    className={`text-12-regular text_primary_gray text-uppercase ${styles.contentLeftCooling}`}
                    data-static-id='TopTileTooltip.js_div_1e6e81'
                  >
                    Fuel
                  </div>
                  <div
                    className={`${styles.contentRightCooling} d-flex`}
                    data-static-id='TopTileTooltip.js_div_0b3f99'
                  >
                    <div
                      className={`${styles.energyConsumption} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_d219b2'
                    >
                      {formatWithUnitNum(apiData?.energyConsumedFuel)}
                    </div>
                    <div
                      className={`${styles.SmallBorderRight}`}
                      data-static-id='TopTileTooltip.js_div_a3c3c9'
                    ></div>
                    <div
                      className={`${styles.energyConsumption} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_bdaf34'
                    >
                      {formatWithUnitNumNa(
                        apiData?.reconciledEnergyConsumedFuel,
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`d-flex align-items-center mt-1 py-1 ${styles.PrimaryBlueBg} ${styles.contentWrapper} w-100`}
                  data-static-id='TopTileTooltip.js_div_7a5105'
                >
                  <div
                    className={`text-12-regular text_primary_gray text-uppercase ${styles.contentLeftCooling}`}
                    data-static-id='TopTileTooltip.js_div_27d4a1'
                  >
                    Steam
                  </div>
                  <div
                    className={`${styles.contentRightCooling} d-flex`}
                    data-static-id='TopTileTooltip.js_div_219a70'
                  >
                    <div
                      className={`${styles.energyConsumption} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_cf527b'
                    >
                      {formatWithUnitNum(apiData?.energyConsumedSteam)}
                    </div>
                    <div
                      className={`${styles.SmallBorderRight}`}
                      data-static-id='TopTileTooltip.js_div_3f319f'
                    ></div>
                    <div
                      className={`${styles.energyConsumption} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_8d8a35'
                    >
                      NA
                    </div>
                  </div>
                </div>

                <div
                  className={`d-flex align-items-center mt-1 py-1 ${styles.PrimaryBlueBg} ${styles.contentWrapper} w-100`}
                  data-static-id='TopTileTooltip.js_div_ac7012'
                >
                  <div
                    className={`text-12-regular text_primary_gray text-uppercase ${styles.contentLeftCooling}`}
                    data-static-id='TopTileTooltip.js_div_0a1b14'
                  >
                    Crude Oil
                  </div>
                  <div
                    className={`${styles.contentRightCooling} d-flex`}
                    data-static-id='TopTileTooltip.js_div_8d9092'
                  >
                    <div
                      className={`${styles.energyConsumption} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_5cba3c'
                    >
                      NA
                    </div>
                    <div
                      className={`${styles.SmallBorderRight}`}
                      data-static-id='TopTileTooltip.js_div_e6c81a'
                    ></div>
                    <div
                      className={`${styles.energyConsumption} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_ed6693'
                    >
                      {formatWithUnitNumNa(
                        apiData?.reconciledEnergyConsumedCrudeOil,
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className={`d-flex align-items-center mt-1 py-1 ${styles.PrimaryBlueBg} ${styles.contentWrapper} w-100`}
                  data-static-id='TopTileTooltip.js_div_41c3f7'
                >
                  <div
                    className={`text-12-bold text_primary_gray text-uppercase ${styles.contentLeftCooling}`}
                    data-static-id='TopTileTooltip.js_div_d540ff'
                  >
                    Total
                  </div>
                  <div
                    className={`${styles.contentRightCooling} d-flex`}
                    data-static-id='TopTileTooltip.js_div_239a1b'
                  >
                    <div
                      className={`${styles.energyConsumption} text-12-bold text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_3b1a28'
                    >
                      {getValsBaseOnCondition(
                        CompareValuesWithSymbol(
                          '&&',
                          apiData?.energyConsumedElectricity != null,
                          apiData?.energyConsumedFuel != null,
                          apiData?.energyConsumedSteam != null,
                        ),
                        `${formatWithUnitNum(apiData?.energyConsumedElectricity + apiData?.energyConsumedFuel + apiData?.energyConsumedSteam)}`,
                        '-',
                      )}
                    </div>
                    <div
                      className={`${styles.SmallBorderRight}`}
                      data-static-id='TopTileTooltip.js_div_a41116'
                    ></div>
                    <div
                      className={`${styles.energyConsumption} text-12-bold text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_a975f8'
                    >
                      {getValsBaseOnCondition(
                        CompareValuesWithSymbol(
                          '&&',
                          apiData?.reconciledEnergyConsumedElectricity != null,
                          apiData?.reconciledEnergyConsumedFuel != null,
                          apiData?.reconciledEnergyConsumedCrudeOil != null,
                        ),
                        `${formatWithUnitNum(apiData?.reconciledEnergyConsumedElectricity + apiData?.reconciledEnergyConsumedFuel + apiData?.reconciledEnergyConsumedCrudeOil)}`,
                        'NA',
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            ''
          )}

          {data?.title === 'SEU ENPI NET' ? (
            <div
              className={`${styles.ToolTipContainerMain} pb-0`}
              data-static-id='TopTileTooltip.js_div_66fc1b'
            >
              <div
                className='d-flex justify-content-between align-items-start'
                data-static-id='TopTileTooltip.js_div_2f4cba'
              >
                <div
                  className={`${styles.LeftContainer}`}
                  data-static-id='TopTileTooltip.js_div_d03802'
                >
                  <div
                    className={`${styles.PrimaryBlueBg} ${styles.textLeft} text-12-regular text_primary_gray text-uppercase`}
                    data-static-id='TopTileTooltip.js_div_b91f17'
                  >
                    Opportunity
                  </div>
                  <div
                    className={`${styles.PrimaryBlueBg}  ${styles.textLeft}  text-12-regular text_primary_gray text-uppercase mt-1`}
                    data-static-id='TopTileTooltip.js_div_1b15a7'
                  >
                    Improvement
                  </div>
                  <div
                    className={`${styles.PrimaryBlueBg}  ${styles.textLeft}  text-12-regular text_primary_gray text-uppercase mt-1`}
                    data-static-id='TopTileTooltip.js_div_0c58e6'
                  >
                    Net
                  </div>
                </div>

                <div
                  className={`${styles.RightContainer}`}
                  data-static-id='TopTileTooltip.js_div_bde413'
                >
                  <div
                    className={`${styles.PrimaryBlueBg} d-flex justify-content-end ${styles.textLeft}  text-12-regular text_primary_gray text-uppercase`}
                    data-static-id='TopTileTooltip.js_div_92d3a0'
                  >
                    {`${formatWithUnitNum(Math.abs(apiData?.opportunity))}`}
                    <div
                      className={`ms-2 me-2`}
                      data-static-id='TopTileTooltip.js_div_8a22d4'
                    >{`GJ`}</div>
                  </div>
                  <div
                    className={`${styles.PrimaryBlueBg}  d-flex justify-content-end ${styles.textLeft}  text-12-regular text_primary_gray text-uppercase mt-1`}
                    data-static-id='TopTileTooltip.js_div_1a4636'
                  >
                    {`${formatWithUnitNum(apiData?.improvementPotential)}`}
                    <div
                      className={`ms-2 me-2`}
                      data-static-id='TopTileTooltip.js_div_e0985f'
                    >{`GJ`}</div>
                  </div>
                  <div
                    className={`${styles.PrimaryBlueBg}  d-flex justify-content-end  ${styles.textLeft}  text-12-regular text_primary_gray text-uppercase mt-1 mb-1`}
                    data-static-id='TopTileTooltip.js_div_aba681'
                  >
                    {getValsBaseOnCondition(
                      CompareValuesWithSymbol(
                        '&&',
                        apiData?.opportunity != null,
                        apiData?.improvementPotential != null,
                      ),
                      `${formatWithUnitNum(apiData?.opportunity + apiData?.improvementPotential)}`,
                      '-',
                    )}
                    <div
                      className={`ms-2 me-2`}
                      data-static-id='TopTileTooltip.js_div_6400cb'
                    >{`GJ`}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            ''
          )}

          {data?.title === 'AIR SYSTEM PERFORMANCE' ? (
            <>
              <div
                className={`${styles.AirSystemTooltip} w-100`}
                data-static-id='TopTileTooltip.js_div_11652b'
              >
                <div
                  className={`d-flex w-100 ${styles.contentWrapper}`}
                  data-static-id='TopTileTooltip.js_div_70fffe'
                >
                  <div
                    className={`text-12-regular text_primary_gray text-uppercase ${styles.contentLeftCooling}`}
                    data-static-id='TopTileTooltip.js_div_79fdf8'
                  ></div>
                  <div
                    className={`${styles.contentRightCooling} flexCenterContainer`}
                    data-static-id='TopTileTooltip.js_div_f655a8'
                  >
                    <div
                      className={`${styles.contentValueCooling} text-12-regular text_primary_gray text-uppercase text-center`}
                      data-static-id='TopTileTooltip.js_div_d00962'
                    >
                      Cost
                      <div data-static-id='TopTileTooltip.js_div_cea49c'>
                        ($)
                      </div>
                    </div>
                    <div
                      className={`${styles.contentValueCooling} text-12-regular text_primary_gray text-uppercase text-center`}
                      data-static-id='TopTileTooltip.js_div_d9ce43'
                    >
                      Load
                      <div data-static-id='TopTileTooltip.js_div_a18e43'>
                        (GJ)
                      </div>
                    </div>
                    <div
                      className={`${styles.contentValueCooling} text-12-regular text_primary_gray text-uppercase text-center`}
                      data-static-id='TopTileTooltip.js_div_e831e6'
                    >
                      % Share
                      <div data-static-id='TopTileTooltip.js_div_534755'>
                        in COST ($)
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`d-flex align-items-center mt-1 py-1 ${styles.PrimaryBlueBg} ${styles.contentWrapper} w-100`}
                  data-static-id='TopTileTooltip.js_div_770043'
                >
                  <div
                    className={`text-12-regular text_primary_gray text-uppercase ${styles.contentLeftCooling}`}
                    data-static-id='TopTileTooltip.js_div_a54ea3'
                  >
                    Motors
                  </div>
                  <div
                    className={`${styles.contentRightCooling} d-flex`}
                    data-static-id='TopTileTooltip.js_div_9322d4'
                  >
                    <div
                      className={`${styles.contentValueCooling} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_585203'
                    >
                      {formatWithUnitNum(apiData?.motorsEnpiDollar)}
                    </div>

                    <div
                      className={`${styles.SmallBorderRight}`}
                      data-static-id='TopTileTooltip.js_div_c46261'
                    ></div>
                    <div
                      className={` ${styles.contentValueCooling} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_f0d0fe'
                    >
                      {formatWithUnitNum(apiData?.motorsConsumptionGJ)}
                    </div>
                    <div
                      className={`${styles.SmallBorderRight}`}
                      data-static-id='TopTileTooltip.js_div_cf9e9c'
                    ></div>
                    <div
                      className={` ${styles.contentValueCooling} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_dfd62c'
                    >
                      {getValsBaseOnCondition(
                        CompareValuesWithSymbol(
                          '&&',
                          apiData?.motorsEnpiDollar != null,
                          apiData?.turbinesENPIDollar != null,
                        ),
                        `${formatWithUnitNum((apiData?.motorsEnpiDollar / (apiData?.motorsEnpiDollar + apiData?.turbinesENPIDollar)) * 100)}`,
                        '-',
                      )}
                      {`%`}
                    </div>
                  </div>
                </div>

                <div
                  className={`d-flex align-items-center mt-1 py-1 ${styles.PrimaryBlueBg} ${styles.contentWrapper} w-100`}
                  data-static-id='TopTileTooltip.js_div_a3b75d'
                >
                  <div
                    className={`text-12-regular text_primary_gray text-uppercase ${styles.contentLeftCooling}`}
                    data-static-id='TopTileTooltip.js_div_cb3b5c'
                  >
                    Turbines
                  </div>
                  <div
                    className={`${styles.contentRightCooling} d-flex`}
                    data-static-id='TopTileTooltip.js_div_73ade9'
                  >
                    <div
                      className={`text-12-regular text_primary_gray text-center ${styles.contentValueCooling}`}
                      data-static-id='TopTileTooltip.js_div_b7b5f4'
                    >
                      {formatWithUnitNum(apiData?.turbinesENPIDollar)}
                    </div>
                    <div
                      className={`${styles.SmallBorderRight}`}
                      data-static-id='TopTileTooltip.js_div_b1f422'
                    ></div>
                    <div
                      className={`text-12-regular text_primary_gray text-center ${styles.contentValueCooling}`}
                      data-static-id='TopTileTooltip.js_div_58e012'
                    >
                      {formatWithUnitNum(apiData?.turbineConsumptionGJ)}
                    </div>
                    <div
                      className={`${styles.SmallBorderRight}`}
                      data-static-id='TopTileTooltip.js_div_368521'
                    ></div>
                    <div
                      className={` ${styles.contentValueCooling} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_2059cd'
                    >
                      {getValsBaseOnCondition(
                        CompareValuesWithSymbol(
                          '&&',
                          apiData?.turbinesENPIDollar != null,
                          apiData?.motorsEnpiDollar != null,
                        ),
                        `${formatWithUnitNum((apiData?.turbinesENPIDollar / (apiData?.motorsEnpiDollar + apiData?.turbinesENPIDollar)) * 100)}`,
                        '-',
                      )}
                      {`%`}
                    </div>
                  </div>
                </div>

                <div
                  className={`d-flex align-items-center mt-1 py-1 ${styles.PrimaryBlueBg} ${styles.contentWrapper} w-100`}
                  data-static-id='TopTileTooltip.js_div_7d9f61'
                >
                  <div
                    className={`text-12-bold text_primary_gray text-uppercase ${styles.contentLeftCooling}`}
                    data-static-id='TopTileTooltip.js_div_e74274'
                  >
                    <div data-static-id='TopTileTooltip.js_div_1213d0'>
                      Actual
                    </div>
                  </div>
                  <div
                    className={`${styles.contentRightCooling} d-flex`}
                    data-static-id='TopTileTooltip.js_div_0e6764'
                  >
                    <div
                      className={`text-12-bold text_primary_gray text-center ${styles.contentValueCooling}`}
                      data-static-id='TopTileTooltip.js_div_175dbc'
                    >
                      <div
                        className='text-center'
                        data-static-id='TopTileTooltip.js_div_d4da11'
                      >{`${formatWithUnitNum(apiData?.motorsEnpiDollar + apiData?.turbinesENPIDollar)}`}</div>
                    </div>
                    <div
                      className={`${styles.SmallBorderRight}`}
                      data-static-id='TopTileTooltip.js_div_05ba84'
                    ></div>
                    <div
                      className={`text-12-bold text_primary_gray text-center ${styles.contentValueCooling}`}
                      data-static-id='TopTileTooltip.js_div_88366f'
                    >
                      {getValsBaseOnCondition(
                        CompareValuesWithSymbol(
                          '&&',
                          apiData?.motorsConsumptionGJ != null,
                          apiData?.turbineConsumptionGJ != null,
                        ),
                        `${formatWithUnitNum(apiData?.motorsConsumptionGJ + apiData?.turbineConsumptionGJ)}`,
                        '-',
                      )}
                    </div>
                    <div
                      className={`${styles.SmallBorderRight}`}
                      data-static-id='TopTileTooltip.js_div_288df9'
                    ></div>
                    <div
                      className={`text-12-bold text_primary_gray text-center ${styles.contentValueCooling}`}
                      data-static-id='TopTileTooltip.js_div_8a9109'
                    >
                      {getValsBaseOnCondition(
                        CompareValuesWithSymbol(
                          '&&',
                          apiData?.motorsEnpiDollar != null,
                          apiData?.turbinesENPIDollar != null,
                        ),
                        `${((apiData?.motorsEnpiDollar / (apiData?.motorsEnpiDollar + apiData?.turbinesENPIDollar)) * 100 + (apiData?.turbinesENPIDollar / (apiData?.motorsEnpiDollar + apiData?.turbinesENPIDollar)) * 100).toFixed(0)}`,
                        '-',
                      )}
                      {`%`}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            ''
          )}

          {data?.title === 'COOLING WATER PERFORMANCE' ? (
            <>
              <div
                className={`${styles.CoolingWaterContainer} `}
                data-static-id='TopTileTooltip.js_div_e76690'
              >
                <div
                  className={`d-flex w-100 ${styles.contentWrapper}`}
                  data-static-id='TopTileTooltip.js_div_17d4f3'
                >
                  <div
                    className={` ${styles.contentLeft} text-12-regular text_primary_gray text-uppercase`}
                    data-static-id='TopTileTooltip.js_div_92a9b9'
                  ></div>
                  <div
                    className={`${styles.contentRight} d-flex`}
                    data-static-id='TopTileTooltip.js_div_07e821'
                  >
                    <div
                      className={` ${styles.contentValue} text-12-regular text_primary_gray text-uppercase text-center`}
                      data-static-id='TopTileTooltip.js_div_bbabdc'
                    >
                      Cost
                      <div data-static-id='TopTileTooltip.js_div_366e63'>
                        ($)
                      </div>
                    </div>
                    <div
                      className={` ${styles.contentValue} text-12-regular text_primary_gray text-uppercase text-center`}
                      data-static-id='TopTileTooltip.js_div_4c4fb4'
                    >
                      % Share
                      <div data-static-id='TopTileTooltip.js_div_1967ad'>
                        in COST ($)
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className={`d-flex align-items-center py-1 ${styles.PrimaryBlueBg} ${styles.contentWrapper} w-100`}
                  data-static-id='TopTileTooltip.js_div_761d12'
                >
                  <div
                    className={` ${styles.contentLeft} text-12-regular text_primary_gray text-uppercase`}
                    data-static-id='TopTileTooltip.js_div_613b1c'
                  >
                    Energy
                  </div>
                  <div
                    className={`${styles.contentRight}  d-flex`}
                    data-static-id='TopTileTooltip.js_div_05b819'
                  >
                    <div
                      className={` ${styles.contentValue}  text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_46e79e'
                    >
                      {formatWithUnitNum(apiData?.cwEnergy)}
                    </div>
                    <div
                      className={`${styles.SmallBorderRight}`}
                      data-static-id='TopTileTooltip.js_div_f17e88'
                    ></div>
                    <div
                      className={`d-flex justify-content-center ${styles.contentValue} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_301a4d'
                    >
                      {getValsBaseOnCondition(
                        CompareValuesWithSymbol(
                          '&&',
                          apiData?.cwEnergy != null,
                          apiData?.cwENPI != null,
                          apiData?.cwCost != null,
                        ),
                        `${formatWithUnitNum((apiData?.cwEnergy / (apiData?.cwEnergy + apiData?.cwENPI + apiData?.cwCost)) * 100)}`,
                        '-',
                      )}
                      <div data-static-id='TopTileTooltip.js_div_9f8bf8'>{`%`}</div>
                    </div>
                  </div>
                </div>

                <div
                  className={`d-flex align-items-center mt-1 py-1 ${styles.PrimaryBlueBg} ${styles.contentWrapper} w-100`}
                  data-static-id='TopTileTooltip.js_div_3b570e'
                >
                  <div
                    className={` ${styles.contentLeft} text-12-regular text_primary_gray text-uppercase`}
                    data-static-id='TopTileTooltip.js_div_3a371d'
                  >
                    Water
                  </div>
                  <div
                    className={`${styles.contentRight} d-flex`}
                    data-static-id='TopTileTooltip.js_div_d0aeae'
                  >
                    <div
                      className={` ${styles.contentValue}  text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_28bcd3'
                    >
                      {formatWithUnitNum(apiData?.cwENPI)}
                    </div>
                    <div
                      className={`${styles.SmallBorderRight}`}
                      data-static-id='TopTileTooltip.js_div_a5448d'
                    ></div>
                    <div
                      className={`d-flex justify-content-center text-12-regular text_primary_gray text-center  ${styles.contentValue}`}
                      data-static-id='TopTileTooltip.js_div_91ab15'
                    >
                      {getValsBaseOnCondition(
                        CompareValuesWithSymbol(
                          '&&',
                          apiData?.cwENPI != null,
                          apiData?.cwEnergy != null,
                          apiData?.cwCost != null,
                        ),
                        `${formatWithUnitNum((apiData?.cwENPI / (apiData?.cwEnergy + apiData?.cwENPI + apiData?.cwCost)) * 100)}`,
                        '-',
                      )}
                      <div data-static-id='TopTileTooltip.js_div_f28932'>{`%`}</div>
                    </div>
                  </div>
                </div>

                <div
                  className={`d-flex align-items-center mt-1  py-1  ${styles.contentWrapper} ${styles.PrimaryBlueBg} w-100`}
                  data-static-id='TopTileTooltip.js_div_135d10'
                >
                  <div
                    className={`text-12-regular text_primary_gray text-uppercase  ${styles.contentLeft}`}
                    data-static-id='TopTileTooltip.js_div_dfcf00'
                  >
                    Chemical
                  </div>
                  <div
                    className={`${styles.contentRight} d-flex`}
                    data-static-id='TopTileTooltip.js_div_532ed0'
                  >
                    <div
                      className={`text-12-regular text_primary_gray text-center  ${styles.contentValue}`}
                      data-static-id='TopTileTooltip.js_div_8d9e62'
                    >
                      {formatWithUnitNum(apiData?.cwCost)}
                    </div>
                    <div
                      className={`${styles.SmallBorderRight}`}
                      data-static-id='TopTileTooltip.js_div_9bed78'
                    ></div>
                    <div
                      className={`d-flex justify-content-center text-12-regular text_primary_gray text-center  ${styles.contentValue}`}
                      data-static-id='TopTileTooltip.js_div_ab64f3'
                    >
                      {getValsBaseOnCondition(
                        CompareValuesWithSymbol(
                          '&&',
                          apiData?.cwCost != null,
                          apiData?.cwEnergy != null,
                          apiData?.cwENPI != null,
                        ),
                        `${formatWithUnitNum((apiData?.cwCost / (apiData?.cwEnergy + apiData?.cwENPI + apiData?.cwCost)) * 100)}`,
                        '-',
                      )}
                      <div data-static-id='TopTileTooltip.js_div_4fd829'>{`%`}</div>
                    </div>
                  </div>
                </div>
                <div
                  className='border-bottom mt-1'
                  data-static-id='TopTileTooltip.js_div_a9272d'
                ></div>

                <div
                  className={`d-flex align-items-center mt-1  ${styles.PrimaryBlueBg} ${styles.contentWrapper} w-100`}
                  data-static-id='TopTileTooltip.js_div_247a75'
                >
                  <div
                    className={` ${styles.contentLeft} text-12-regular text-nowrap text_primary_gray text-uppercase`}
                    data-static-id='TopTileTooltip.js_div_b1a727'
                  >
                    Cooling Water Load (GJ)
                  </div>
                  <div
                    className={`${styles.contentRight} d-flex`}
                    data-static-id='TopTileTooltip.js_div_f2166b'
                  >
                    <div
                      className={`${styles.contentValue} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_b745a3'
                    ></div>
                    <div
                      className={`${styles.contentValue} text-12-regular text_primary_gray text-center`}
                      data-static-id='TopTileTooltip.js_div_7ae613'
                    >
                      {formatWithUnitNum(apiData?.coolingWaterLoad)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            ''
          )}

          {data?.title === 'STEAM SYSTEM LOSSES' ? (
            <div
              className={`${styles.SteamLossContainer}`}
              data-static-id='TopTileTooltip.js_div_1f78c9'
            >
              <div
                className={`${styles.contentWrapper} d-flex `}
                data-static-id='TopTileTooltip.js_div_1006ca'
              >
                <div
                  className={`${styles.contentLeft}`}
                  data-static-id='TopTileTooltip.js_div_7f2d08'
                ></div>
                <div
                  className={`${styles.contentRight} d-flex`}
                  data-static-id='TopTileTooltip.js_div_686bd2'
                >
                  <div
                    className={`${styles.contentValue} text-12-regular text_primary_gray text-uppercase text-center `}
                    data-static-id='TopTileTooltip.js_div_e8dbb1'
                  >
                    Cost
                    <div data-static-id='TopTileTooltip.js_div_7d1727'>
                      {' '}
                      ($){' '}
                    </div>
                  </div>
                  <div
                    className={`${styles.contentValue} text-12-regular text_primary_gray text-uppercase text-center `}
                    data-static-id='TopTileTooltip.js_div_f4f98a'
                  >
                    Load
                    <div data-static-id='TopTileTooltip.js_div_ad3a8d'>
                      {' '}
                      (GJ){' '}
                    </div>
                  </div>
                  <div
                    className={`${styles.contentValue} text-12-regular text_primary_gray text-uppercase text-center`}
                    data-static-id='TopTileTooltip.js_div_8ee8ae'
                  >
                    % Share
                    <div data-static-id='TopTileTooltip.js_div_742de4'>
                      in COST ($)
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`${styles.PrimaryBlueBg} ${styles.contentWrapper} w-100 mt-1 d-flex align-items-center py-1`}
                data-static-id='TopTileTooltip.js_div_46a15e'
              >
                <div
                  className={`${styles.contentLeft} py-1 text-nowrap text-12-regular text_primary_gray text-uppercase`}
                  data-static-id='TopTileTooltip.js_div_55c993'
                >
                  Steam Vent
                </div>
                <div
                  className={`${styles.contentRight} d-flex`}
                  data-static-id='TopTileTooltip.js_div_95622e'
                >
                  <div
                    className={`${styles.contentValue} text-12-regular text_primary_gray text-center `}
                    data-static-id='TopTileTooltip.js_div_ffb5e0'
                  >
                    {formatWithUnitNum(apiData?.steamVentsDollar)}
                  </div>
                  <div
                    className={`${styles.SmallBorderRight}`}
                    data-static-id='TopTileTooltip.js_div_2699db'
                  ></div>
                  <div
                    className={`${styles.contentValue} text-12-regular text_primary_gray text-center`}
                    data-static-id='TopTileTooltip.js_div_f4ad7c'
                  >
                    {formatWithUnitNum(apiData?.steamVentGJ)}
                  </div>
                  <div
                    className={`${styles.SmallBorderRight}`}
                    data-static-id='TopTileTooltip.js_div_050e56'
                  ></div>
                  <div
                    className={`${styles.contentValue} d-flex justify-content-center text-12-regular text_primary_gray text-center`}
                    data-static-id='TopTileTooltip.js_div_28100b'
                  >
                    {getValsBaseOnCondition(
                      CompareValuesWithSymbol(
                        '&&',
                        apiData?.steamVentsDollar != null,
                        apiData?.steamLetDownDollar != null,
                        apiData?.steamDumpedDollar,
                      ),
                      `${formatWithUnitNum((apiData?.steamVentsDollar / (apiData?.steamVentsDollar + apiData?.steamLetDownDollar + apiData?.steamDumpedDollar)) * 100)}`,
                      '-',
                    )}
                    <div data-static-id='TopTileTooltip.js_div_41cbac'>{`%`}</div>
                  </div>
                </div>
              </div>

              <div
                className={`${styles.PrimaryBlueBg}  ${styles.contentWrapper} w-100 mt-1 d-flex align-items-center py-1`}
                data-static-id='TopTileTooltip.js_div_a7191a'
              >
                <div
                  className={`${styles.contentLeft} py-1 text-nowrap text-12-regular text_primary_gray text-uppercase`}
                  data-static-id='TopTileTooltip.js_div_1b9b1d'
                >
                  Steam Letdown
                </div>
                <div
                  className={`${styles.contentRight} d-flex`}
                  data-static-id='TopTileTooltip.js_div_57aa78'
                >
                  <div
                    className={`${styles.contentValue} text-12-regular text_primary_gray text-center`}
                    data-static-id='TopTileTooltip.js_div_daf0cc'
                  >
                    {formatWithUnitNum(apiData?.steamLetDownDollar)}
                  </div>
                  <div
                    className={`${styles.SmallBorderRight}`}
                    data-static-id='TopTileTooltip.js_div_1dcc59'
                  ></div>
                  <div
                    className={`${styles.contentValue} text-12-regular text_primary_gray text-center`}
                    data-static-id='TopTileTooltip.js_div_bb39ce'
                  >
                    {formatWithUnitNum(apiData?.steamLetDownGJ)}
                  </div>
                  <div
                    className={`${styles.SmallBorderRight}`}
                    data-static-id='TopTileTooltip.js_div_95c7c9'
                  ></div>
                  <div
                    className={`${styles.contentValue} d-flex justify-content-center text-12-regular text_primary_gray text-center`}
                    data-static-id='TopTileTooltip.js_div_bcf4b1'
                  >
                    {getValsBaseOnCondition(
                      CompareValuesWithSymbol(
                        '&&',
                        apiData?.steamVentsDollar != null,
                        apiData?.steamLetDownDollar != null,
                        apiData?.steamDumpedDollar,
                      ),
                      `${formatWithUnitNum((apiData?.steamLetDownDollar / (apiData?.steamVentsDollar + apiData?.steamLetDownDollar + apiData?.steamDumpedDollar)) * 100)}`,
                      '-',
                    )}
                    <div data-static-id='TopTileTooltip.js_div_929c05'>{`%`}</div>
                  </div>
                </div>
              </div>

              <div
                className={`${styles.PrimaryBlueBg}  ${styles.contentWrapper} w-100 mt-1 d-flex align-items-center py-1`}
                data-static-id='TopTileTooltip.js_div_89653b'
              >
                <div
                  className={`${styles.contentLeft} py-1  text-nowrap text-12-regular text_primary_gray text-uppercase`}
                  data-static-id='TopTileTooltip.js_div_2a5586'
                >
                  Steam Dumped
                </div>
                <div
                  className={`${styles.contentRight} d-flex`}
                  data-static-id='TopTileTooltip.js_div_908b60'
                >
                  <div
                    className={`${styles.contentValue} text-12-regular text_primary_gray text-center`}
                    data-static-id='TopTileTooltip.js_div_f511ff'
                  >
                    {formatWithUnitNum(apiData?.steamDumpedDollar)}
                  </div>
                  <div
                    className={`${styles.SmallBorderRight}`}
                    data-static-id='TopTileTooltip.js_div_d75326'
                  ></div>
                  <div
                    className={`${styles.contentValue} text-12-regular text_primary_gray text-center`}
                    data-static-id='TopTileTooltip.js_div_dec66e'
                  >
                    {formatWithUnitNum(apiData?.steamDumpedGJ)}
                  </div>
                  <div
                    className={`${styles.SmallBorderRight}`}
                    data-static-id='TopTileTooltip.js_div_3bc148'
                  ></div>
                  <div
                    className={`${styles.contentValue} d-flex justify-content-center text-12-regular text_primary_gray text-center`}
                    data-static-id='TopTileTooltip.js_div_a6d49f'
                  >
                    {getValsBaseOnCondition(
                      CompareValuesWithSymbol(
                        '&&',
                        apiData?.steamVentsDollar != null,
                        apiData?.steamLetDownDollar != null,
                        apiData?.steamDumpedDollar,
                      ),
                      `${formatWithUnitNum((apiData?.steamDumpedDollar / (apiData?.steamVentsDollar + apiData?.steamLetDownDollar + apiData?.steamDumpedDollar)) * 100)}`,
                      '-',
                    )}
                    <div data-static-id='TopTileTooltip.js_div_73ecbe'>{`%`}</div>
                  </div>
                </div>
              </div>

              <div
                className={`${styles.PrimaryBlueBg} ${styles.contentWrapper} w-100 mt-1 d-flex align-items-center py-1`}
                data-static-id='TopTileTooltip.js_div_8629e6'
              >
                <div
                  className={` text-12-bold text_primary_gray text-uppercase py-1 ${styles.contentLeft}`}
                  data-static-id='TopTileTooltip.js_div_0e429e'
                >
                  Actual
                  <div
                    className='text-12-regular text_primary_gray'
                    data-static-id='TopTileTooltip.js_div_958335'
                  >
                    (Target)
                  </div>
                </div>
                <div
                  className={`${styles.contentRight} d-flex`}
                  data-static-id='TopTileTooltip.js_div_a016b0'
                >
                  <div
                    className={` text-center ${styles.contentValue}`}
                    data-static-id='TopTileTooltip.js_div_5187c4'
                  >
                    <div
                      className={`text-12-bold text-center  text_primary_gray `}
                      data-static-id='TopTileTooltip.js_div_b578c5'
                    >
                      {getValsBaseOnCondition(
                        CompareValuesWithSymbol(
                          '&&',
                          apiData?.steamVentsDollar != null,
                          apiData?.steamLetDownDollar != null,
                          apiData?.steamDumpedDollar != null,
                        ),
                        `${formatWithUnitNum(apiData?.steamVentsDollar + apiData?.steamLetDownDollar + apiData?.steamDumpedDollar)}`,
                        '-',
                      )}
                    </div>

                    <div
                      className={`text-12-regular text-center  text_primary_gray `}
                      data-static-id='TopTileTooltip.js_div_78b889'
                    >
                      {`(${formatWithUnitNum(apiData?.steamLossTargetDollar)})`}
                    </div>
                  </div>
                  <div
                    className={`${styles.SmallBorderRight}`}
                    data-static-id='TopTileTooltip.js_div_69fc50'
                  ></div>
                  <div
                    className={` text-center  ${styles.contentValue}`}
                    data-static-id='TopTileTooltip.js_div_795945'
                  >
                    <div
                      className={`text-12-bold text-center  text_primary_gray `}
                      data-static-id='TopTileTooltip.js_div_92a76c'
                    >
                      {getValsBaseOnCondition(
                        CompareValuesWithSymbol(
                          '&&',
                          apiData?.steamVentGJ != null,
                          apiData?.steamLetDownGJ != null,
                          apiData?.steamDumpedGJ != null,
                        ),
                        `${formatWithUnitNum(apiData?.steamVentGJ + apiData?.steamLetDownGJ + apiData?.steamDumpedGJ)}`,
                        '-',
                      )}
                    </div>

                    <div
                      className='text-12-regular text-center  text_primary_gray'
                      data-static-id='TopTileTooltip.js_div_b235ec'
                    >
                      {`(${formatWithUnitNum(apiData?.steamLossTargetGJ)})`}
                    </div>
                  </div>
                  <div
                    className={`${styles.SmallBorderRight}`}
                    data-static-id='TopTileTooltip.js_div_d83835'
                  ></div>
                  <div
                    className={`d-flex justify-content-center text-12-bold text_primary_gray text-center ${styles.contentValue}`}
                    data-static-id='TopTileTooltip.js_div_abf8c7'
                  >
                    {getValsBaseOnCondition(
                      CompareValuesWithSymbol(
                        '&&',
                        apiData?.steamVentsDollar != null,
                        apiData?.steamLetDownDollar != null,
                        apiData?.steamDumpedDollar != null,
                      ),
                      `${((apiData?.steamVentsDollar / (apiData?.steamVentsDollar + apiData?.steamLetDownDollar + apiData?.steamDumpedDollar)) * 100 + (apiData?.steamLetDownDollar / (apiData?.steamVentsDollar + apiData?.steamLetDownDollar + apiData?.steamDumpedDollar)) * 100 + (apiData?.steamDumpedDollar / (apiData?.steamVentsDollar + apiData?.steamLetDownDollar + apiData?.steamDumpedDollar)) * 100).toFixed(0)}`,
                      '-',
                    )}
                    <div data-static-id='TopTileTooltip.js_div_73c517'>{`%`}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
    </div>
  )
}
