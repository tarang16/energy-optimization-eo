export default function Footer() {
  return (
    <div className='d-flex h-100 w-100 align-items-center justify-content-between px-4'>
      <span className='text-12-regular text_primary_gray_2'>
        Steam Network Studio &middot; v0.1.0
      </span>
      <span className='text-12-regular text_primary_gray_2'>
        <span
          style={{
            display: 'inline-block',
            width: '0.8vmin',
            height: '0.8vmin',
            borderRadius: '50%',
            background: '#3fb950',
            marginRight: '0.6vmin',
            boxShadow: '0 0 0.6vmin rgba(63,185,80,.6)',
          }}
        />
        Connected
      </span>
    </div>
  )
}
