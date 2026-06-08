import { AppAtom } from 'atoms/AppAtom'
import ErrorBoundary from 'components/error_boundary/ErrorBoundary'
import { ERRORMSG } from 'config/Config'
import { useAtomValue } from 'jotai'
import { Outlet, useParams } from 'react-router-dom'
import { getAffiliateIdByCaseID, getAffiliateIdByName } from 'utills/utilities'
export default function Dashboard() {
  const params = useParams()
  const ctxData = useAtomValue(AppAtom)
  const caseId = getAffiliateIdByName(params?.affiliate, ctxData?.caseData)
  const affiliateId = getAffiliateIdByCaseID(caseId, ctxData?.caseData)
  return (
    <ErrorBoundary message={ERRORMSG.APPLICATION_ERROR}>
      {!caseId ? (
        <div
          className='h-100 w-100 d-flex align-items-center justify-content-center'
          data-static-id='Dashboard.js_div_1e2001'
        >
          <p className='text-18-bold' data-static-id='Dashboard.js_p_1652fe'>
            Invalid System name please try using the Quick Access.
          </p>
        </div>
      ) : (
        <Outlet
          context={{
            caseId,
            affiliateId,
          }}
        />
      )}
    </ErrorBoundary>
  )
}
