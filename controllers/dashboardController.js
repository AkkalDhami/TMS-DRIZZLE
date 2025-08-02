// get dashbaord page
export const getDashbaordPage = (req, res) => {
    try {
        res.render('pages/dashboard', {
            title: 'Dashbaord Page',
            location: '/dashboard'
        });
    } catch (error) {
        console.error('Error rendering dashbaord page:', error);
        res.status(500).send('Internal Server Error');
    }
}