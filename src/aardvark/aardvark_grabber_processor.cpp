#include "aardvark_grabber_processor.h"


namespace aardvark
{
	::kj::Promise<void> AvGrabberProcessorImpl::updateGrabberIntersections( UpdateGrabberIntersectionsContext context ) 
	{
		uint32_t grabberId = context.getParams().getGrabberId();
		GrabberIntersections_t intersections;
		intersections.isPressed = context.getParams().getGrabPressed();
		auto msgProx = context.getParams().getIntersections();
		for ( auto id : msgProx )
		{
			intersections.intersectingGrabbables.push_back( id );
		}

		auto msgHooks = context.getParams().getHooks();
		for ( auto id : msgHooks )
		{
			intersections.intersectingHooks.push_back( id );
		}

		m_intersections.insert_or_assign( grabberId, intersections );
		return kj::READY_NOW;
	}

	EAvSceneGraphResult AvGrabberProcessorImpl::avGetNextGrabberIntersection( uint32_t grabberNodeId,
		bool *isGrabberPressed,
		uint64_t *grabberIntersections, uint32_t intersectionArraySize,
		uint32_t *usedIntersectionCount,
		uint64_t *hooks, uint32_t hookArraySize,
		uint32_t *usedHookCount )
	{
		if ( grabberNodeId == 0 || !usedIntersectionCount || !isGrabberPressed )
		{
			return EAvSceneGraphResult::InvalidParameter;
		}

		auto intersections = m_intersections.find( grabberNodeId );
		if ( intersections == m_intersections.end() )
		{
			return EAvSceneGraphResult::NoEvents;
		}

		*usedIntersectionCount = (uint32_t)intersections->second.intersectingGrabbables.size();
		if ( intersections->second.intersectingGrabbables.size() > intersectionArraySize )
		{
			return EAvSceneGraphResult::InsufficientBufferSize;
		}

		*usedHookCount = (uint32_t)intersections->second.intersectingHooks.size();
		if ( intersections->second.intersectingHooks.size() > hookArraySize )
		{
			return EAvSceneGraphResult::InsufficientBufferSize;
		}

		memcpy( grabberIntersections, intersections->second.intersectingGrabbables.data(),
			sizeof( uint64_t ) * *usedIntersectionCount );
		memcpy( hooks, intersections->second.intersectingHooks.data(),
			sizeof( uint64_t ) * *usedHookCount );
		*isGrabberPressed = intersections->second.isPressed;

		return EAvSceneGraphResult::Success;
	}

}