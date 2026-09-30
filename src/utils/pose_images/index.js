import chair from './chair.jpg'
import cobra from './cobra.jpg'
import dog from './dog.jpg'
import tree from './tree.jpg'
import warrior from './warrior.jpg'
import traingle from './traingle.jpg'
import shoulderstand from './shoulderstand.jpg'
import pose from './pose.jpg'

// Next resolves an image import to a StaticImageData object rather than the
// URL string Create React App produced, so `.src` is taken here once and every
// consumer keeps using these as plain strings.
export const poseImages = {
    Tree: tree.src,
    Cobra: cobra.src,
    Dog: dog.src,
    Warrior: warrior.src,
    Chair: chair.src,
    Traingle: traingle.src,
    Shoulderstand: shoulderstand.src,
    Pose: pose.src
}
