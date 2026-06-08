import { useState } from 'react'
import { Tab, Tabs } from 'react-bootstrap'
import {
  getCorruptedFailedInstance,
  getPastTerminatedInstances,
} from 'services/WorkflowServices'
import CorruptedInstance from './CorruptedInstance'
import styles from './WorkflowInstanceTabs.module.scss'
export default function WorkflowInstanceTabs() {
  const [selectedTab, setSelectedTab] = useState('corrupted_failed_instance')
  const tabsData = [
    {
      eventKey: 'corrupted_failed_instance',
      title: 'Corrupted/Failed Instances',
      infoMsg:
        'THIS PAGE DISPLAYS A LIST OF ALL CORRUPTED AND FAILED PROCESS INSTANCES IN BPM , WHICH CAN BE REVIEWED AND MANAGED THROUGH THE SCREEN',
      dataFn: getCorruptedFailedInstance,
    },
    {
      eventKey: 'terminated_instance',
      title: 'Past Terminated Instances',
      infoMsg:
        'THIS PAGE DISPLAYS ALL THE CORRUPTED/FAILED INSTANCES IN BPM WHICH ARE TERMINATED IN THE PAST',
      dataFn: getPastTerminatedInstances,
    },
  ]
  return (
    <div
      className={`${styles.parentContainerWI} w-100 h-100`}
      data-static-id='WorkflowInstanceTabs.js_div_67a720'
    >
      <div
        className={`${styles.WorkflowInstanceTabs} ${styles.box}`}
        data-static-id='WorkflowInstanceTabs.js_div_8a050c'
      >
        <Tabs
          defaultActiveKey={selectedTab}
          onSelect={(e) => {
            setSelectedTab(e)
          }}
          data-static-id='WorkflowInstanceTabs.js_Tabs_a59d58'
        >
          {tabsData?.map((tab) => (
            <Tab
              eventKey={tab?.eventKey}
              title={tab?.title}
              id={tab?.eventKey}
              key={tab?.eventKey}
              data-static-id='WorkflowInstanceTabs.js_Tab_934542'
            >
              <div
                className={`${styles.tableContainer} h-100`}
                data-static-id='WorkflowInstanceTabs.js_div_57f42e'
              >
                <CorruptedInstance
                  eventKey={tab?.eventKey}
                  infoMsg={tab?.infoMsg}
                  tabKey={selectedTab}
                  dataFn={tab.dataFn}
                />
              </div>
            </Tab>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
